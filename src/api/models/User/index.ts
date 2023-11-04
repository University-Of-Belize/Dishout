import { Request, Response } from "express";
import what from "../../utility/Whats";
import { what_is, wis_array, wis_string } from "../../utility/What_Is";
import { get_authorization_user } from "../../utility/Authentication";
import { ErrorFormat, iwe_strings } from "../../strings";
import Product from "../../../database/models/Products";
import mongoose from "mongoose";
// Add to the cart
// Note (unrelated to API): Frontend groups array of productIds
// This function should: Take in the user's cart as an array in "is" and user.cart.push(productId);
async function cart_modify(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] !== what.public.user) {
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

  // Value check. Does this belong here?
  const [item, quantity] = wis_array(req);

  // Check if ID is a valid string/ObjectId
  if (typeof item != "string" || !mongoose.Types.ObjectId.isValid(item)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (!quantity || typeof quantity != "number") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  // Is this a valid cart item?
  const product = await Product.findById(item);
  if (!product) {
    return res.status(400).json(ErrorFormat(iwe_strings.Product.ENOTFOUND));
  }

  // Decrease the quantity by how much we ordered. If there's to little give an error
  if (product.in_stock == 0) {
    return res.status(406).json(ErrorFormat(iwe_strings.Product.EOUTOFSTOCK));
  }
  if (product.in_stock - quantity < 0) {
    return res.status(406).json(ErrorFormat(iwe_strings.Product.ETOOMANY));
  }
  if (quantity < 0) {
    return res.status(406).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Decrease the quantity
  product.in_stock = product.in_stock - quantity;

  // Populate the cart with the product
  // @ts-ignore
  user.cart.push({ product: product._id, quantity: quantity });

  // Save and return
  // @ts-ignore
  user.save();
  product.save();
  res.json(what_is(what.public.user, product));
}

// Remove from the cart or empty it completely
/*
@Note Couldn't get it to accept both real integers and string integers. Built diff I guess

what: "user",
is: null // Delete the entire cart


what: "user",
is: string // remove something from the cart

*/
async function cart_delete(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] !== what.public.user) {
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

  // Value check. Does this belong here?
  const item_index = parseInt(wis_string(req));

  // Check if item_index is undefined or not a valid number
  if (Number.isNaN(item_index) && wis_string(req) !== undefined) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // If null then that means we want to empty the cart
  if (item_index == undefined) {
    // Go through the cart, putting back the items
    // @ts-ignore
    // let totalQuantity = 0;
    // let cart_product;

    // Loop through all of the products and get all the quanities for each item while putting them back
    // @ts-ignore
    // for (const product of user.cart) {
    //   cart_product = await Product.findById(product.product);
    //   if (cart_product) {
    //     cart_product.in_stock = cart_product.in_stock + product.quantity;
    //     console.log(cart_product.in_stock);
    //     await cart_product.save();
    //   }
    // }

    // [OPTIMIZED]: Create an array of product ids and their quantities
    const productUpdates = user.cart.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { in_stock: item.quantity } },
      },
    }));

    // Update all products in one go
    await Product.bulkWrite(productUpdates);

    // Empty the cart
    // @ts-ignore
    user.cart = undefined;
    // @ts-ignore
    user.save();
    return res.json({ status: true });
  }

  if (item_index < 0) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Put back the item
  // @ts-ignore
  const item_to_putback = await Product.findById(user.cart[item_index].product);
  // Weird
  if (!item_to_putback) {
    return res
      .status(500)
      .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
  }

  // Remove item from the cart by index
  // @ts-ignore
  user.cart.splice(item_index, 1);

  // Save and return
  // @ts-ignore
  user.save();
  res.json({ status: true });
}

// Not using the function "delete_object" here, because, it's different.
async function cart_list(req: Request, res: Response) {
  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // @ts-ignore
  return res.json(what_is(what.public.user, user.cart));
}

export { cart_delete, cart_modify, cart_list };
