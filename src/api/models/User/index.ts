import { Request, Response } from "express";
import what from "../../utility/Whats";
import { what_is, wis_array } from "../../utility/What_Is";
import { get_authorization_user } from "../../utility/Authentication";
import { ErrorFormat, iwe_strings } from "../../strings";
import User from "../../../database/models/Users";
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
  const product = Product.findById(item);
  if (!product) {
    return res.status(400).json(ErrorFormat(iwe_strings.Product.ENOTFOUND));
  }
  
  // Populate the cart with the product
  // @ts-ignore
  user.cart.push({product, quantity})
  
  // @ts-ignore
  user.save();
  res.json({status: true})
}

// Remove from the cart or empty it completely
/*
what: "user",
is: null // Delete the entire cart


what: "user",
is: string // remove something from the cart

*/
function cart_delete(req: Express.Request, res: Response) {}

export { cart_delete, cart_modify };
