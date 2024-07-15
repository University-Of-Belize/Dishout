// Import our proper types
import { Request, Response } from "express";
// Import the schemas
import Menu from "../../../../../database/models/Products";
import ProductVariation from "../../../../../database/models/ProductVariation";
import CatProductVariation from "../../../../../database/models/CatProductVariation";
import { ErrorFormat, iwe_strings } from "../../../../strings";
import { get_authorization_user } from "../../../../utility/Authentication";
import what from "../../../../utility/Whats";
import { what_is, wis_array } from "../../../../utility/What_Is";
import { delete_object } from "../../../../utility/batchRequest";
import settings from "../../../../../config/settings.json";
import mongoose from "mongoose";

// Create a new product variation
async function variation_create(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.variation) {
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }

  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Is this person a staff member?
  if (!user.staff) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.ENOACCESS));
  }

  // Extract information from the 'what_is' object
  const [variation_name, category_id] = wis_array(req);

  // verify
  const testFailed = check_values(res, variation_name, category_id);

  if (testFailed) return;

  // Check if a document with the same name and vcat_id already exists
  const existing_variation = await ProductVariation.findOne({
    Name: variation_name.trim().toLowerCase(),
    VCategory_id: category_id,
  });

  if (existing_variation) {
    return res.status(400).json({
      status: false,
      message: iwe_strings.Product.Variation.EEXISTS,
    });
  }

  // Check if the vcategory exists
  const existing_category = await CatProductVariation.findById(category_id);
  if (!existing_category) {
    return res.status(400).json({
      status: false,
      message: iwe_strings.Product.Variation.Category.ENOTFOUND,
    });
  }

  // create the variation
  const newVariation = new ProductVariation({
    Name: variation_name,
    VCategory_id: category_id,
  });

  await newVariation.save();
  return res.json({
    status: true,
  });
}

// Delete a new product variation
async function variation_delete(req: Request, res: Response) {}

// Modify a new product variation
async function variation_modify(req: Request, res: Response) {}

function check_values(
  res: Response,
  variation_name: string,
  category_id: string
  //OTHER ...
) {
  if (
    variation_name.trim() === "" ||
    category_id.trim() === "" ||
    !mongoose.Types.ObjectId.isValid(category_id) ||
    typeof variation_name != "string" ||
    typeof category_id != "string"
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  return 0;
}

export {
  variation_create as vmenu_create,
  variation_delete as vmenu_delete,
  variation_modify as vmenu_modify,
};
