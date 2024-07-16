// Import our proper types
import { Request, Response } from "express";
// Import the schemas
import mongoose from "mongoose";
import CatProductVariation from "../../../../../database/models/CatProductVariation";
import ProductVariation from "../../../../../database/models/ProductVariation";
import { ErrorFormat, iwe_strings } from "../../../../strings";
import { get_authorization_user } from "../../../../utility/Authentication";
import { wis_array } from "../../../../utility/What_Is";
import what from "../../../../utility/Whats";

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
  return res.json([iwe_strings.Product.Variation.ICREATE, newVariation]);
}

// Delete a product variation
async function variation_delete(req: Request, res: Response) {
  // We want to delete the product variation
  // Note: URL is formatted as /api/admin/menu/variation/:variation_id
  const variation_id = req.params.variation_id;

  // Do not check what_is, as we are only deleting a Variation
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

  // verify (using the ID checking function)
  const testFailed = check_values(res, "unused", variation_id);
  if (testFailed) return;

  // Check if the variation exists
  const variation = await ProductVariation.findById(variation_id);

  if (!variation) {
    return res.status(404).json({
      status: false,
      message: iwe_strings.Product.Variation.ENOTFOUND,
    });
  }

  // Delete the variation
  await ProductVariation.findByIdAndDelete(variation_id);

  return res.json({
    message: iwe_strings.Product.Variation.IDELETE,
    status: true,
  });
}

// Modify a new product variation
async function variation_modify(req: Request, res: Response) {
  // We want to modify the product variation
  // Note: URL is formatted as /api/admin/menu/variation/:variation_id
  const variation_id = req.params.variation_id;
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
  const varIdFailed = check_values(res, "unused", variation_id);
  if (varIdFailed) return;

  // Check if a document with the same name and vcat_id already exists
  const existing_variation = await ProductVariation.findById(variation_id);

  if (!existing_variation) {
    return res.status(404).json({
      status: false,
      message: iwe_strings.Product.Variation.ENOTFOUND,
    });
  }

  const duplicate_variation = await ProductVariation.findOne({
    Name: variation_name.trim().toLowerCase(),
  });

  if (duplicate_variation) {
    if (
      duplicate_variation._id.toString() === existing_variation._id.toString()
    ) {
      return res.status(400).json({
        status: false,
        message: iwe_strings.Product.Variation.EISEXACT,
      });
    }
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

  if (variation_name.trim() != "") {
    existing_variation.Name = variation_name;
  }
  if (category_id) {
    existing_variation.VCategory_id = category_id;
  }

  await existing_variation.save();
  return res.json([
    iwe_strings.Product.Variation.IMODIFY,
    existing_variation,
  ]);
}

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
