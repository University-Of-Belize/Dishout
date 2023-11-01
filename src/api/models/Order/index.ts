import { Request, Response } from "express";
import { list_object } from "../../utility/batchRequest";
import Order from "../../../database/models/Orders";
import what from "../../utility/Whats";

async function order_list(req: Request, res: Response) {
  await list_object(req, res, Order, what.public.order, true, false);
}

// Calculate the total amount, and take in the promo code
// Must be accessible to only registered users, as it will need the cart.
// If the cart is empty, then print out an error saying that the cart must not be empty. "The shopping cart is empty"
// If not empty, transfer the user's cart into order.products, then, empty the user's shopping cart
// Afterward, return a what_is as iwe_strings.Order.IOSTATUSQUEUED, and also email the user the same status code as a notification
function order_create(req: Express.Request, res: Express.Response){}
function order_delete(req: Express.Request, res: Express.Response){}
function order_modify(req: Express.Request, res: Express.Response){}
export { order_list, order_create, order_delete, order_modify };
