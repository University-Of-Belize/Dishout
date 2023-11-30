// Should handle acception, deletion and modification using what_is
// In all cases: what = "order_batchrequest"
// In all cases: is[1] = Order_id
// For acception: is[0] = "a" --> This should mark the order as accepted inside the database by activating the flag --- send email to user "Accepted"
// For deletion: is[0] = "d"  -- Send email to user "Declined"
// For modification: is[0] = "m"  -- Send email to user "Overriden"

import { Request, Response } from "express";
import Order from "../../../../database/models/Orders";
import User from "../../../../database/models/Users";
import settings from "../../../../config/settings.json";
import { sendEmail } from "../../../../util/email";

import what from "../../../utility/Whats";
import { ErrorFormat, iwe_strings } from "../../../strings";
import { get_authorization_user } from "../../../utility/Authentication";
import { what_is, wis_array } from "../../../utility/What_Is";
import mongoose from "mongoose";
import { list_object } from "../../../utility/batchRequest";

// List all promotions
async function order_list(req: Request, res: Response) {
  await list_object(req, res, Order, what.private.order, false, true, [
    {
      path: "order_from",
      model: "Users",
    }, {
      path: "override_by",
      model: "Users",
    }, {
      path: "products.product",
      model: "Products",
    }
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

  // Extract the action and order ID from the request body
  const [action, orderId, new_amount, new_promo, new_delay] = wis_array(req);
  // Check if the OrderID is valid
  if (typeof orderId != "string" || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (new_amount && typeof new_amount != "number") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (new_promo && typeof new_promo != "string") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (new_delay && typeof new_delay != "number") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
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
    case "a": // Accept the order
      order.is_accepted = true;
      await sendEmail(
        order_from.email,
        `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSACCEPTED}`,
        null,
        `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSACCEPTED}`,
      );
      break;
    case "d": // Delete the order
      await Order.findByIdAndDelete(orderId);
      await sendEmail(
        order_from.email,
        `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSDENIED}`,
        null,
        `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSDENIED}`,
      );
      return res
        .status(200)
        .json(what_is(what.private.order, iwe_strings.Order.IDELETE));
    case "m": // Modify the order
      // Here you would handle the modifications to the order
      // This will depend on what fields of the order you want to allow modifying
      // @ts-ignore
      order.override_by = user._id;
      if (new_amount) {
        await sendEmail(
          order_from.email,
          `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSMODIFIED}`,
          null,
          `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSMODIFIED
          }. Note that you are no longer paying $${order.total_amount ?? "0.00"
          }, but instead $${new_amount}.`,
        );
        order.total_amount = new_amount;
      }
      if (new_promo) {
        if (!order.promo_code) {
          await sendEmail(
            order_from.email,
            `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSMODIFIED}`,
            null,
            `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSMODIFIED}. The promo code <b>${new_promo}</b> has been automatically applied to your order.`,
          );
        } else {
          await sendEmail(
            order_from.email,
            `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSMODIFIED}`,
            null,
            `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSMODIFIED}. Note that your order's promo code <b>${order.promo_code}</b> has been updated to ${new_promo}.`,
          );
        }
        order.promo_code = new_promo;
      }
      if (new_delay) {
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
            `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSMODIFIED}. Your order has been delayed by ${delayInMinutes} minutes.`,
          );
        } else {
          // Handle the case where the order already had a delay time
          await sendEmail(
            order_from.email,
            `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSDELAYED}`,
            null,
            `Hi ${order_from.username}, <br/>${iwe_strings.Order.IOSTATUSMODIFIED}. Your order has been delayed by another ${delayInMinutes} minutes.`,
          );
        }
        order.delay_time = new_delay;
      }

      break;
    default:
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Save the updated order
  await order.save();

  // Return the updated order as a JSON response
  return res.json(what_is(what.private.order, order));
}
export { order_list, order_manage };
