import { Request, Response } from "express";
import { list_object } from "../../utility/batchRequest";
import Order from "../../../database/models/Orders";
import Product from "../../../database/models/Products";
import what from "../../utility/Whats";
import { ErrorFormat, iwe_strings } from "../../strings";
import { get_authorization_user } from "../../utility/Authentication";
import { wis_string } from "../../utility/What_Is";
import { uuid } from "uuidv4";
import { Decimal128 } from "mongoose";

async function order_list(req: Request, res: Response) {
  await list_object(req, res, Order, what.public.order, true, false);
}

// Calculate the total amount, and take in the promo code
// Must be accessible to only registered users, as it will need the cart.
// If the cart is empty, then print out an error saying that the cart must not be empty. "The shopping cart is empty"
// If not empty, transfer the user's cart into order.products, then, empty the user's shopping cart
// Afterward, return a what_is as iwe_strings.Order.IOSTATUSQUEUED, and also email the user the same status code as a notification

async function order_create(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] !== what.public.order) {
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

  // @ts-ignore
  if (!user.cart || user.cart.length === 0) {
    return res.status(400).json(ErrorFormat(iwe_strings.Order.EEMPTYCART));
  }

  const promo_code = wis_string(req);

  const order = new Order({
    order_code: uuid(),
    order_date: Math.floor(Date.now() / 1000),
    total_amount: 0,
    promo_code: promo_code,
    // @ts-ignore
    order_from: user._id, // @ts-ignore
    products: user.cart,
  });

  // @ts-ignore
  user.cart = undefined;

  if (!order ?? !order.products) {
    return res
      .status(500)
      .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
  }

  // @ts-ignore
  let totalAmount: Decimal128 = 0;
  let cart_product;

  // Loop through all of the products and dump it into the cart
  for (const product of order.products) {
    cart_product = await Product.findOne({ _id: product });
    if (cart_product) {
      // @ts-ignore
      totalAmount = cart_product.price;
    }
  }

  // @ts-ignore
  order.total_amount = totalAmount;

  // @ts-ignore
  await user.save();
  await order.save();

  // Send email notification to user
  // ...

  res.status(201).json(order);
}
function order_delete(req: Request, res: Response) {}
function order_modify(req: Request, res: Response) {}

export { order_list, order_create, order_delete, order_modify };
