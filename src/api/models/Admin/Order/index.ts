// Should handle acception, deletion and modification using what_is
// In all cases: what = "order_batchrequest"
// In all cases: is[1] = Order_id
// For acception: is[0] = "a" --> This should mark the order as accepted inside the database by activating the flag --- send email to user "Accepted"
// For deletion: is[0] = "d"  -- Send email to user "Declined"
// For modification: is[0] = "m"  -- Send email to user "Overriden"

import { Request, Response } from "express";
import settings from "../../../../config/settings.json";
import Order from "../../../../database/models/Orders";
import Promo from "../../../../database/models/Promos";
import User from "../../../../database/models/Users";
import { sendEmail } from "../../../../util/email";

import * as admin from "firebase-admin";
import mongoose from "mongoose";
import { ErrorFormat, NotifyFormat, iwe_strings } from "../../../strings";
import { get_authorization_user } from "../../../utility/Authentication";
import { what_is, wis_array } from "../../../utility/What_Is";
import what from "../../../utility/Whats";
import { list_object } from "../../../utility/batchRequest";
import { isValidTimeZone } from "../../../utility/time";

// List all orders
async function order_list(req: Request, res: Response) {
  // Check the query
  const completed: boolean = req.query["completed"]?.toString() === "true";

  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }
  // @ts-expect-error 'staff' actually does exist, just a bug in the schemas
  if (!user?.staff) {
    // Regular users are allowed to query their own orders (orders that pertain to them)
    const orders = await Order.find({
      // @ts-expect-error '_id' actually does exist, just a bug in the schemas
      order_from: user._id,
      completed: false,
    }).populate([
      {
        path: "order_from",
        model: "Users",
      },
      {
        path: "override_by",
        model: "Users",
      },
      {
        path: "promo_code",
        model: "Promos",
      },
      {
        path: "products.product",
        model: "Products",
      },
    ]); // Mongoose casts strings to ObjectIds automatically
    return res.json(what_is(what.private.order, orders));
  }
  // Staff members are allowed to query all orders
  await list_object(
    req,
    res,
    Order,
    what.private.order,
    false,
    true,
    [
      {
        path: "order_from",
        model: "Users",
      },
      {
        path: "override_by",
        model: "Users",
      },
      {
        path: "promo_code",
        model: "Promos",
      },
      {
        path: "products.product",
        model: "Products",
      },
    ],
    { completed: completed }
  );
}

async function order_manage(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.order) {
    // Two underscores means it's an admin function
    return res.status(418).send(ErrorFormat(iwe_strings.Generic.EFOLLOWRULES));
  }

  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Is this person a staff member?
  // @ts-ignore
  if (!user.staff) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.ENOACCESS));
  }
  let new_promo_object: any; // Allows us to pass a promo code instead of an ObjectId

  // Extract the action and order ID from the request body
  const [action, orderId, new_amount, new_promo, new_delay] = wis_array(req);
  // Check if the OrderID is valid
  if (typeof orderId != "string" || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (action === "m") {
    if (new_amount && typeof new_amount != "number") {
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
    if (new_promo && typeof new_promo != "string") {
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
    // Find the promotion
    new_promo_object = await Promo.findOne({ code: new_promo });
    if ((new_delay && typeof new_delay != "number") || !new_promo_object) {
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
  }
  // Find the order by its ID
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json(ErrorFormat(iwe_strings.Order.EONOEXISTS));
  }

  const order_from = await User.findById(order.order_from);
  if (!order_from) {
    return res.status(404).json(ErrorFormat(iwe_strings.Users.ENOTFOUND));
  }

  // Handle the different actions
  switch (action) {
    case "a":
      {
        // Accept the order
        order.is_accepted = true;
        if (new_delay) {
          order.delay_time = new_delay;
          await sendEmail(
            order_from.email,
            `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSACCEPTED}`,
            null,
            `Hey ${order_from.username}!<br/><br/>${
              iwe_strings.Order.IOSTATUSACCEPTED
            } We estimate it should be ready at ${(() => {
              let r;
              try {
                if (
                  !order_from.timeZone ||
                  !isValidTimeZone(order_from.timeZone)
                ) {
                  throw new Error("Invalid timezone");
                }
                r = `${new Date(new_delay * 1000).toLocaleString(undefined, {
                  timeZone: order_from.timeZone ?? "BAD_TZ",
                })} (your time).`;
              } catch {
                r = `${new Date(new_delay * 1000).toLocaleString(undefined, {
                  timeZone: settings.server.defaultTimeZone,
                })}.<br/>--<br/>Time incorrect? Change it in <a href="https://${
                  settings.server.domain
                }/admin/dashboard/user/manage?user_id=${
                  order_from._id
                }" target="_blank">settings</a>.`;
              }
              return r;
            })()}`
          );
          // Send push notification as well
          await admin.messaging().send(
            NotifyFormat(
              settings.server.nickname + " — Order Accepted",
              iwe_strings.Order.IOSTATUSACCEPTED +
                ` We estimate it should be ready at ${(() => {
                  let r;
                  try {
                    if (
                      !order_from.timeZone ||
                      !isValidTimeZone(order_from.timeZone)
                    ) {
                      throw new Error("Invalid timezone");
                    }
                    r = `${new Date(new_delay * 1000).toLocaleString(
                      undefined,
                      {
                        timeZone: order_from.timeZone ?? "BAD_TZ",
                      }
                    )} (your time).`;
                  } catch {
                    r = `${new Date(new_delay * 1000).toLocaleString(
                      undefined,
                      {
                        timeZone: settings.server.defaultTimeZone,
                      }
                    )}.`;
                  }
                  return r;
                })()}`,
              order_from.channel_id
            )
          );
        } else {
          await sendEmail(
            order_from.email,
            `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSACCEPTED}`,
            null,
            `Hi ${order_from.username},<br/><br/>${iwe_strings.Order.IOSTATUSREADYNOW}`
          );
          // Send push notification as well
          await admin
            .messaging()
            .send(
              NotifyFormat(
                settings.server.nickname + " — Your Order is Ready",
                iwe_strings.Order.IOSTATUSREADYNOW +
                  " Drop by at the cafeteria and pick it up!",
                order_from.channel_id
              )
            );
        }
      }
      break;
    case "d": {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json(ErrorFormat(iwe_strings.Order.EONOEXISTS));
      } // @ts-expect-error There is a bug in the TypeScript definitions for the server
      order_from.credit =
        parseInt(order_from.credit.toString()) +
        parseInt(order.final_amount.toString());
      // Delete the order
      await order.deleteOne();
      await sendEmail(
        order_from.email,
        `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSDENIED}`,
        null,
        `Hi ${order_from.username},<br/><br/>${iwe_strings.Order.IOSTATUSDENIED}`
      );
      // Send push notification as well
      await admin
        .messaging()
        .send(
          NotifyFormat(
            settings.server.nickname + " — Order Rejected",
            "Unfortunately, " +
              iwe_strings.Order.IOSTATUSDENIED.toLowerCase() +
              " Sorry about that.",
            order_from.channel_id
          )
        );
      return res
        .status(200)
        .json(what_is(what.private.order, iwe_strings.Order.IDELETE));
    }
    case "r": {
      // ~~Delete the order~~
      // await Order.findByIdAndDelete(orderId);
      // Mark the order as ready
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json(ErrorFormat(iwe_strings.Order.EONOEXISTS));
      }
      order.completed = true;
      await order.save();

      // Send the email
      await sendEmail(
        order_from.email,
        `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSREADYNOW}`,
        null,
        `Hi ${order_from.username},<br/><br/>${iwe_strings.Order.IOSTATUSREADYNOW}`
      );
      // Send push notification as well
      await admin
        .messaging()
        .send(
          NotifyFormat(
            settings.server.nickname + " — Your Order is Ready",
            iwe_strings.Order.IOSTATUSREADYNOW +
              " Drop by at the cafeteria and pick it up!",
            order_from.channel_id
          )
        );
      return res
        .status(200)
        .json(what_is(what.private.order, iwe_strings.Order.IREADY));
    }
    case "m": // Modify the order
      {
        // Here you would handle the modifications to the order
        // This will depend on what fields of the order you want to allow modifying
        // Get the user and update their credit
        const order_from = await User.findById(order.order_from);
        if (!order_from) {
          return res.status(404).json(ErrorFormat(iwe_strings.Users.ENOTFOUND));
        }
        // @ts-ignore
        order.override_by = user._id;
        if (new_amount && new_amount != order.final_amount) {
          await sendEmail(
            order_from.email,
            `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSMODIFIED}`,
            null,
            `Hi ${order_from.username},<br/><br/>${
              iwe_strings.Order.IOSTATUSMODIFIED
            } Note that you are no longer paying $${
              parseFloat(order.final_amount.toString()).toFixed(2) ?? "0.00"
            }, but instead $${parseFloat(new_amount.toString()).toFixed(
              2
            )}.<br/>Questions regarding this price change?<br/>
            Please direct any queries or concerns either to one of our staff members or get in touch with us at ${
              settings.email.username
            }@${settings.email.domain}.`
          );
          // Send push notification as well
          await admin
            .messaging()
            .send(
              NotifyFormat(
                settings.server.nickname + " — Order Modified",
                iwe_strings.Order.IOSTATUSMODIFIED +
                  ` Your total amount to pay has been updated from $${
                    parseFloat(order.final_amount.toString()).toFixed(2) ??
                    "0.00"
                  } to $${parseFloat(new_amount.toString()).toFixed(
                    2
                  )}. Contact our staff for any queries you may have.`,
                order_from.channel_id
              )
            );
          if (new_amount < order.final_amount) {
            order_from.credit = // @ts-expect-error MongoDB should cast this automatically back to a Decimal128
              order_from.credit + (order.final_amount - new_amount);
          } else if (new_amount > order.final_amount) {
            order_from.credit = // @ts-expect-error MongoDB should cast this automatically back to a Decimal128
              order_from.credit - (new_amount - order.final_amount);
          }
          // Update the order's total amount
          order.final_amount = new_amount;
          await order_from.save();
        }
        const _p = await Promo.findById(order.promo_code);
        if (new_promo && new_promo != _p?.code) {
          if (!order.promo_code) {
            await sendEmail(
              order_from.email,
              `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSMODIFIED}`,
              null,
              `Hi ${order_from.username},<br/><br/>${iwe_strings.Order.IOSTATUSMODIFIED}. The promo code <b>${new_promo}</b> has been automatically applied to your order.`
            );
            // Send push notification as well
            await admin
              .messaging()
              .send(
                NotifyFormat(
                  settings.server.nickname + " — Order Modified",
                  iwe_strings.Order.IOSTATUSMODIFIED +
                    ` The promo code '${new_promo}' has been applied to your order, taking off a total of ${new_promo_object.discount_percentage}% off your total amount to pay.`,
                  order_from.channel_id
                )
              );
            order.promo_code = new_promo_object._id; // Cast string to ObjectId
            // Update the order data accordingly
            order.discount_amount = parseFloat(
              (
                order.total_amount *
                (new_promo_object.discount_percentage / 100)
              ).toString()
            ).toFixed(2);
            order.final_amount = parseFloat(
              (order.total_amount - order.discount_amount).toString()
            ).toFixed(2);
          } else {
            const _p = await Promo.findById(order.promo_code);
            if (_p) {
              await sendEmail(
                order_from.email,
                `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSMODIFIED}`,
                null,
                `Hi ${order_from.username},<br/><br/>${iwe_strings.Order.IOSTATUSMODIFIED}. Note that your order's promo code <b>${_p.code}</b> has been swapped to ${new_promo}.`
              );
              // Send push notification as well
              await admin
                .messaging()
                .send(
                  NotifyFormat(
                    settings.server.nickname + " — Order Modified",
                    iwe_strings.Order.IOSTATUSMODIFIED +
                      ` Your order's promo code has been swapped from '${_p.code}' to ${new_promo}.`,
                    order_from.channel_id
                  )
                );
              order.promo_code = new_promo_object._id; // Cast string to ObjectId
              // Update the order data accordingly
              order.discount_amount = parseFloat(
                (
                  order.total_amount *
                  (new_promo_object.discount_percentage / 100)
                ).toString()
              ).toFixed(2);
              order.final_amount = parseFloat(
                (order.total_amount - order.discount_amount).toString()
              ).toFixed(2);
            }
          }
        }
        if (new_delay && new_delay !== order.delay_time) {
          const oldDelay = new Date((order.delay_time ?? 0) * 1000); // Convert Unix timestamp to JavaScript Date object
          const newDelay = new Date(new_delay * 1000); // Convert Unix timestamp to JavaScript Date object

          // Calculate the delay in minutes
          const delayInMinutes =
            (newDelay.getTime() - oldDelay.getTime()) / 1000 / 60;

          const delayInHours =
            delayInMinutes >= 60 ? Math.floor(delayInMinutes / 60) : 0;

          if (!order.delay_time) {
            await sendEmail(
              order_from.email,
              `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSDELAYED}`,
              null,
              `Hi ${order_from.username},<br/><br/>${
                iwe_strings.Order.IOSTATUSDELAYED
              }. Your order has been delayed by <b>${
                delayInHours !== 0 ? delayInHours + " hours, " : ""
              }${
                delayInMinutes !== 0
                  ? delayInMinutes - delayInHours * 60 + " minutes"
                  : ""
              }</b>.`
            );
            // Send push notification as well
            await admin
              .messaging()
              .send(
                NotifyFormat(
                  settings.server.nickname + " — Urgent Message (Your Order)",
                  iwe_strings.Order.IOSTATUSDELAYED +
                    ` Your order has been delayed by ${
                      delayInHours !== 0 ? delayInHours + " hours, " : ""
                    }${
                      delayInMinutes !== 0
                        ? delayInMinutes - delayInHours * 60 + " minutes"
                        : ""
                    }.`,
                  order_from.channel_id
                )
              );
          } else {
            // Handle the case where the order already had a delay time
            await sendEmail(
              order_from.email,
              `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSDELAYED}`,
              null,
              `Hi ${order_from.username},<br/><br/>${
                iwe_strings.Order.IOSTATUSMODIFIED
              } Your order has been delayed by another <b>${
                delayInHours !== 0 ? delayInHours + " hours, " : ""
              }${
                delayInMinutes !== 0
                  ? delayInMinutes - delayInHours * 60 + " minutes"
                  : ""
              }</b>.`
            );
            // Send push notification as well
            await admin
              .messaging()
              .send(
                NotifyFormat(
                  settings.server.nickname + " — Urgent Message (Your Order)",
                  iwe_strings.Order.IOSTATUSDELAYED +
                    `. Your order has been delayed by another ${
                      delayInHours !== 0 ? delayInHours + " hours, " : ""
                    }${
                      delayInMinutes !== 0
                        ? delayInMinutes - delayInHours * 60 + " minutes"
                        : ""
                    }.`,
                  order_from.channel_id
                )
              );
          }
          order.delay_time = new_delay;
        }
      }
      break;
    default: {
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
    // break;
  }

  // Save the updated order
  await order.save();

  // Return the updated order as a JSON response
  return res.json(what_is(what.private.order, order));
}
export { order_list, order_manage };

