import { Request, Response } from "express";
import { list_object, delete_object } from "../../utility/batchRequest";
import Order from "../../../database/models/Orders";
import Product from "../../../database/models/Products";
import Promo from "../../../database/models/Promos";
import what from "../../utility/Whats";
import { ErrorFormat, iwe_strings } from "../../strings";
import { get_authorization_user } from "../../utility/Authentication";
import { what_is, wis_array, wis_string } from "../../utility/What_Is";
import { sendEmail } from "../../../util/email";
import settings from "../../../config/settings.json";
import { v4 } from "uuid";
import mongoose from "mongoose";

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
  const testFailed = check_values(res, undefined, promo_code);
  if (testFailed) return;

  let promo;
  if (promo_code) {
    promo = await Promo.findById(promo_code);
  }

  const order = new Order({
    order_code: v4(),
    order_date: Math.floor(Date.now() / 1000),
    total_amount: 0,
    promo_code: promo,
    // @ts-ignore
    order_from: user._id, // @ts-ignore
    products: user.cart,
  });

  // @ts-ignore
  if (!order && !order.products) {
    return res
      .status(500)
      .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
  }

  // @ts-ignore
  user.cart = undefined;
  // @ts-ignore
  // let totalAmount = 0;
  // let cart_product;

  // Loop through all of the products and dump it into the cart
  //  for (const product of order.products) {
  //   const cart_product = await Product.findById(product.product);
  //   if (cart_product) {
  //       // @ts-ignore
  //   totalAmount = parseFloat(totalAmount) + parseFloat(cart_product.price);  // Keep the same types
  //   }
  // }

  // [OPTIMIZED]: Loop through all of the products and dump it into the cart

  // Get an array of product ids
  let productIds = order.products.map((item) => item.product);

  // Find all products in one go
  let products = await Product.find({ _id: { $in: productIds } });

  // Calculate the total amount
  let totalAmount = products.reduce(
    // @ts-ignore
    (total, product) => total + parseFloat(product.price),
    0
  );

  // @ts-ignore
  order.total_amount = totalAmount.toFixed(2);

  // @ts-ignore
  await user.save();
  await order.save();

  // Send email notification to user
  sendEmail(
    // @ts-ignore
    user.email,
    `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSQUEUED}`,
    null, //@ts-ignore
    `Hi ${user.username}, <br/>${iwe_strings.Order.IOSTATUSQUEUED}`
  );

  res.status(201).json(what_is(what.public.order, order));
}

// Delete our orders by ID
async function order_delete(req: Request, res: Response) {
  delete_object(
    req,
    res,
    Order,
    "order_code",
    what.public.order,
    iwe_strings.Order.EONOEXISTS,
    true
  );
}

async function order_modify(req: Request, res: Response) {
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

  const [orderID, promo_code, { product_action, index, productID, quantity }] =
    wis_array(req);

  const testFailed = check_values(
    res,
    orderID,
    promo_code,
    product_action,
    index,
    productID,
    quantity
  );
  if (testFailed) return;

  let promo;
  if (promo_code) {
    promo = await Promo.findById(promo_code);
  }

  if (promo_code && !promo) {
    // In a really weird-case scenario if it ever does happen
    return res
      .status(500)
      .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
  }

  const order = await Order.findById(orderID);
  if (!order) {
    return res.status(404).json(ErrorFormat(iwe_strings.Order.EONOEXISTS));
  }
  const product = await Product.findById(productID);
  if (!product) {
    return res.status(404).json(ErrorFormat(iwe_strings.Product.ENOTFOUND));
  }

  // Do we own this order?
  // @ts-ignore
  if (!user.staff && order.order_from == user._id) {
    return res.status(403).json(ErrorFormat(iwe_strings.Order.ENOPERMS));
  }
  if (order.products && index > order.products.length - 1) {
    return res.status(400).json(ErrorFormat(iwe_strings.Order.EBADINDEX));
  }
  // Is the product in stock?
  if (quantity > product.in_stock) {
    return res.status(400).json(ErrorFormat(iwe_strings.Product.ETOOMANY));
  }
  // [EXPLOIT_PROTECTION]: Is the user requesting a negative amount of the product?
  if (quantity < 0) {
    return res.status(400).json(ErrorFormat(iwe_strings.Product.ETOOLITTLE));
  }

  // Ported from /admin/order/manage
  // Handle the different actions
  switch (product_action) {
    case "d": // Delete the order
      // Splice the products
      // @ts-ignore
      order.products.splice(index, 1);
      await order.save();
      return res
        .status(200)
        .json(what_is(what.public.order, [iwe_strings.Order.IPDELETE, order]));
    case "m": // Modify the order
      // Here you would handle the modifications to the order
      // This will depend on what fields of the order you want to allow modifying
      // @ts-ignore
      order.override_by = user._id; // @ts-ignore
      const oldQ = order.products[index].quantity;

      if (quantity) {
        if (order.products) {
          // Do some magic
          // @ts-ignore
          if (productID == order.products[index].product.toString()) {
            
            product.in_stock = // @ts-ignore
              product.in_stock + order.products[index].quantity; // Do a restore
          }
          order.products[index].quantity = quantity;
          product.in_stock = product.in_stock - quantity;
        }
      }
      if (productID) {
        if (order.products) {
          // @ts-ignore
          if (productID != order.products[index].product.toString()) {
            const product = await Product.findById(
              order.products[index].product
            ); // @ts-ignore
            product.in_stock = product.in_stock + oldQ; // Do a restore on the old one
            // @ts-ignore
            await product.save();
          }

          if (quantity != order.products[index].quantity) {
            product.in_stock = product.in_stock - quantity;
          }
          // @ts-ignore
          order.products[index].product = productID; // Mongoose will automatically try to cast strings to ObjectIds
        }
      }
      if (promo_code) {
        // @ts-ignore
        order.promo_code = promo._id; // Mongoose will automatically try to cast strings to ObjectIds
      }
      break;
    default:
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Get the order we are editing from the database and update it
  await product.save();
  await order.save();
  return res.json(
    what_is(what.public.order, [iwe_strings.Order.IPMODIFY, order])
  );
}

function check_values(
  res: Response,
  orderID?: number,
  promo_code?: mongoose.Schema.Types.ObjectId | string,
  product_action?: string,
  index?: number,
  productID?: mongoose.Schema.Types.ObjectId,
  quantity?: number
) {
  if (
    (orderID && Number.isNaN(orderID)) ||
    (index && Number.isNaN(index)) ||
    (quantity && Number.isNaN(quantity))
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (
    (promo_code &&
      (typeof promo_code != "string" ||
        !mongoose.Types.ObjectId.isValid(promo_code))) ||
    (promo_code && promo_code == null)
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Product.EBADPROMO));
  }
  if (
    (productID &&
      (typeof productID != "string" ||
        !mongoose.Types.ObjectId.isValid(productID))) ||
    (product_action && typeof product_action !== "string")
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  return 0;
}

export { order_list, order_create, order_delete, order_modify };
