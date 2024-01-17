import { Request, Response } from "express";
import mongoose, { Decimal128 } from "mongoose";
import process from "node:process";
import { v4 } from "uuid";
import settings from "../../../config/settings.json";
import Order from "../../../database/models/Orders";
import Product from "../../../database/models/Products";
import Promo from "../../../database/models/Promos";
import ProductResearch from "../../../database/models/research/ProductData";
import { sendEmail } from "../../../util/email";
import { ErrorFormat, iwe_strings } from "../../strings";
import { get_authorization_user } from "../../utility/Authentication";
import { what_is, wis_array } from "../../utility/What_Is";
import what from "../../utility/Whats";
import { delete_object, list_object } from "../../utility/batchRequest";
const onelink_token = process.env.ONELINK_TOKEN ?? settings.transactions.token;
const onelink_salt = process.env.ONELINK_SALT ?? settings.transactions.salt;

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

  const { method, data = [], discount_code } = req.body.is; // We're doing it differently this time
  // const promo_code = wis_string(req);
  const testFailed = check_values(res, undefined, discount_code);
  if (testFailed) return;
  let promo;

  // console.log(method, data, discount_code);

  // Value Check
  if (
    !method ||
    (method && typeof method !== "string") ||
    (method &&
      method === "card" &&
      (typeof data === "undefined" ?? data.length === 0))
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  // Value Check ENDS
  if (discount_code) {
    // promo = await Promo.findById(promo_code);
    promo = await Promo.findOne({ code: discount_code }); // Accept codes instead of ObjectIds
  }

  const amount_to_pay = user.cart.reduce(
    (accumulator, currentValue) =>
      accumulator + currentValue.product.price * currentValue.quantity,
    0
  );

  /** Conduct the transaction if we chose card */
  switch (method) {
    case "card":
      {
        const [card_number, card_expiry, cvc, cardholder_name] = data;
        // console.log(
        //   onelink_token,
        //   onelink_salt,
        //   card_number,
        //   card_expiry,
        //   cvc,
        //   cardholder_name,
        //   amount_to_pay
        // );
        try {
          const r = await fetch("https://api.onelink.bz/payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Authorization: `Bearer ${onelink_token}`, // I wish, lol
            },
            body: JSON.stringify({
              token: onelink_token,
              salt: onelink_salt,
              nameOnCard: cardholder_name,
              cardNumber: card_number,
              expirationDate: card_expiry,
              ccv: cvc, // Imagine, CCV lmao 'Cadbury Creme Egg' / 'Card Card Verification' instead of 'Card Verification Value'
              amount: amount_to_pay,
            }),
          });
          if (!r.ok) {
            try {
              const response = await r.json();
              return res.status(500).json(ErrorFormat(response.msg));
            } catch {
              return res
                .status(500)
                .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
            }
          }
          const body = await r.text();
          if (!body || (body && body === "")) {
            return res
              .status(500)
              .json(
                ErrorFormat(
                  "Our payment provider is currently experiencing issues. Please try again later."
                )
              );
          }
          // @remind Remove this second condition after bro implements something better
          const response = await r.json();
          // console.log(response);
          if (
            !response.msg ||
            (response.msg && response.msg !== "success") // Check for a numeric code
          ) {
            // Take the first character and check to see if this is (quite, possibly) a numeric code
            return res
              .status(500)
              .json(
                ErrorFormat(response.msg ?? iwe_strings.Generic.EINTERNALERROR)
              );
          }
        } catch (error) {
          return res
            .status(500)
            .json(
              ErrorFormat(error.message ?? iwe_strings.Generic.EINTERNALERROR)
            );
        }
      }
      break;
    case "credit": // @ts-ignore
      {
        user.credit = user.credit - amount_to_pay; // @ts-ignore
        if (user.credit < 0) {
          // There is a negative balance
          return res
            .status(400)
            .json(ErrorFormat(iwe_strings.Users.EINSUFFICIENTFUNDS));
        }
      }
      break;
    case "pickup":
    default:
      return res
        .status(400)
        .json(ErrorFormat(iwe_strings.Generic.ENOTIMPLEMENTED));
  }
  /** END Conduct the transaction */

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

  // // Get an array of product ids
  // let productIds = order.products.map((item) => item.product);

  // // Find all products in one go
  // let products = await Product.find({ _id: { $in: productIds } });

  // Calculate the total amount
  // let totalAmount: number = 0;
  // // Calculate the total amount based on the products in the order
  // order.products.reduce(
  //   (accumulator, currentValue) =>
  //     accumulator + currentValue.price * currentValue.quantity,
  //   0
  // ),
  // @remind Needs refactoring to improve performance and efficiency
  for (let product of order.products) {
    const product_ = await Product.findById(product.product);
    if (product_) {
      // Data to track
      let productresearch = await ProductResearch.findOne({ product });
      if (!productresearch) {
        productresearch = await ProductResearch.create({ product });
      }
      productresearch.purchased += 1;
      await productresearch.save(); // Constant write (is that good??)
    }
  }

  // @ts-ignore
  order.total_amount = amount_to_pay.toFixed(2);

  // @ts-ignore
  await user.save();
  await order.save();

  // Send email notification to user
  sendEmail(
    // @ts-ignore
    user.email,
    `${settings.server.nickname} — ${iwe_strings.Order.IOSTATUSQUEUED}`,
    null, //@ts-ignore
    `Hi ${user.username},<br/><br/>${iwe_strings.Order.IOSTATUSQUEUED}. Your order has been queued and is awaiting review. If there's something wrong, we will contact you to check it out.`
  );

  res.status(201).json(what_is(what.public.order, order));
}

// Delete our orders by ID
async function order_delete(req: Request, res: Response) {
  // @todo Restock the products on order removal
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

  const [
    orderID,
    promo_code,
    {
      product_action = null,
      index = null,
      productID = null,
      quantity = null,
    } = {},
  ] = wis_array(req);

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
    // promo = await Promo.findById(promo_code);
    promo = await Promo.findOne({ code: promo_code }); // Accept codes instead of ObjectIds
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
  if (product_action != "d") {
    // If we're not attempting a delete
    const product = await Product.findById(productID);

    if (!product) {
      return res.status(404).json(ErrorFormat(iwe_strings.Product.ENOTFOUND));
    }
    // Is the product in stock?
    if (quantity > product.in_stock) {
      return res.status(400).json(ErrorFormat(iwe_strings.Product.ETOOMANY));
    }
  }
  // Do we own this order?
  // @ts-ignore
  if (!user.staff && order.order_from == user._id) {
    return res.status(403).json(ErrorFormat(iwe_strings.Order.ENOPERMS));
  }
  if (order.products && index > order.products.length - 1) {
    return res.status(400).json(ErrorFormat(iwe_strings.Order.EBADINDEX));
  }
  // [EXPLOIT_PROTECTION]: Is the user requesting a negative amount of the product?
  if (quantity < 0) {
    return res.status(400).json(ErrorFormat(iwe_strings.Product.ETOOLITTLE));
  }

  // Ported from /admin/order/manage
  // Handle the different actions
  switch (product_action) {
    case "d": // Delete one of the products
      // Decrease the total price as we disassociate the product with the order
      const product_to_delete = await Product.findById(
        order.products?.[index]?.product
      );
      // Don't mind this.
      order.total_amount = parseFloat(
        parseFloat(order.total_amount.toString()) -
          parseFloat(product_to_delete?.price.toString())
      ).toFixed(2) as unknown as Decimal128;
      // Splice the products
      // @ts-ignore
      order.products.splice(index, 1);
      try {
        await order.save();
      } catch (error) {
        // Combat spams lul
        return res
          .status(400)
          .json(ErrorFormat(iwe_strings.Order.EREMOVALFAILED));
      }
      // @todo Restock the products on product removal
      // If we have no products left in the order
      if (order.products?.length == 0) {
        // Delete this order
        await order.deleteOne();
      }
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

export { order_create, order_delete, order_list, order_modify };
