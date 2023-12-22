// Should handle acception, deletion and modification using what_is
// In all cases: what = "order_batchrequest"
// In all cases: is[1] = Order_id
// For acception: is[0] = "a" --> This should mark the order as accepted inside the database by activating the flag --- send email to user "Accepted"
// For deletion: is[0] = "d"  -- Send email to user "Declined"
// For modification: is[0] = "m"  -- Send email to user "Overriden"

import { Request, Response } from "express";
import Order from "../../../../database/models/Orders";
import Promo from "../../../../database/models/Promos";
import User from "../../../../database/models/Users";
import settings from "../../../../config/settings.json";
import { sendEmail } from "../../../../util/email";

import what from "../../../utility/Whats";
import { ErrorFormat, iwe_strings } from "../../../strings";
import { get_authorization_user } from "../../../utility/Authentication";
import { what_is, wis_array } from "../../../utility/What_Is";
import { list_object } from "../../../utility/batchRequest";
import mongoose from "mongoose";
import { isValidTimeZone } from "../../../utility/time";

// List all orders
async function order_list(req: Request, res: Response) {
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }
  // @ts-ignore
  if (!user?.staff) {
    // Regular users are allowed to query their own orders (orders that pertain to them)
    // @ts-ignore
    const orders = Order.find({ order_from: user._id }); // Mongoose casts strings to ObjectIds automatically
    return res.json(what_is(what.private.order, orders));
  }
  // Staff members are allowed to query all orders
  await list_object(req, res, Order, what.private.order, false, true, [
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
  ]);
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
            `Hi ${order_from.username}, <br/>${
              iwe_strings.Order.IOSTATUSACCEPTED
            } It will be ready at ${(() => {
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
        } else {
          await sendEmail(
            order_from.email,
            `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSACCEPTED}`,
            null,
            `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSREADYNOW}`
          );
        }
      }
      break;
    case "d": {
      // Delete the order
      await Order.findByIdAndDelete(orderId);
      await sendEmail(
        order_from.email,
        `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSDENIED}`,
        null,
        `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSDENIED}`
      );
      return res
        .status(200)
        .json(what_is(what.private.order, iwe_strings.Order.IDELETE));
    }
    case "m": // Modify the order
      {
        // Here you would handle the modifications to the order
        // This will depend on what fields of the order you want to allow modifying
        // @ts-ignore
        order.override_by = user._id;
        if (new_amount && new_amount != order.total_amount) {
          await sendEmail(
            order_from.email,
            `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSMODIFIED}`,
            null,
            `Hi ${order_from.username}, <br/>${
              iwe_strings.Order.IOSTATUSMODIFIED
            }. Note that you are no longer paying $${
              order.total_amount ?? "0.00"
            }, but instead $${new_amount}.`
          );
          order.total_amount = new_amount;
        }
        const _p = await Promo.findById(order.promo_code);
        if (new_promo && new_promo != _p?.code) {
          if (!order.promo_code) {
            await sendEmail(
              order_from.email,
              `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSMODIFIED}`,
              null,
              `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSMODIFIED}. The promo code <b>${new_promo}</b> has been automatically applied to your order.`
            );
            order.promo_code = new_promo_object._id; // Cast string to ObjectId
          } else {
            const _p = await Promo.findById(order.promo_code);
            if (_p) {
              await sendEmail(
                order_from.email,
                `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSMODIFIED}`,
                null,
                `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSMODIFIED}. Note that your order's promo code <b>${_p.code}</b> has been updated to ${new_promo}.`
              );
              order.promo_code = new_promo_object._id; // Cast string to ObjectId
            }
          }
        }
        if (new_delay && new_delay !== order.delay_time) {
          const oldDelay = new Date((order.delay_time ?? 0) * 1000); // Convert Unix timestamp to JavaScript Date object
          const newDelay = new Date(new_delay * 1000); // Convert Unix timestamp to JavaScript Date object

          // Calculate the delay in minutes
          const delayInMinutes =
            (newDelay.getTime() - oldDelay.getTime()) / 1000 / 60;

          if (!order.delay_time) {
            await sendEmail(
              order_from.email,
              `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSDELAYED}`,
              null,
              `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSMODIFIED}. Your order has been delayed by ${delayInMinutes} minutes.`
            );
          } else {
            // Handle the case where the order already had a delay time
            await sendEmail(
              order_from.email,
              `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSDELAYED}`,
              null,
              `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSMODIFIED}. Your order has been delayed by another ${delayInMinutes} minutes.`
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
