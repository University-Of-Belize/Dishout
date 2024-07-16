// Import our proper types
import { Request, Response } from "express";
// Import the schemas
import Menu from "../../../../../../database/models/Products";
import ProductVariation from "../../../../../../database/models/ProductVariation";
import CatProductVariation from "../../../../../../database/models/CatProductVariation";
import { ErrorFormat, iwe_strings } from "../../../../../strings";
import { get_authorization_user } from "../../../../../utility/Authentication";
import what from "../../../../../utility/Whats";
import { what_is, wis_array } from "../../../../../utility/What_Is";
import { delete_object } from "../../../../../utility/batchRequest";
import settings from "../../../../../../config/settings.json";
import mongoose from "mongoose";

async function vcategory_create(req: Request, res: Response) {
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
  const [vcat_name, product_id] = wis_array(req);

  // verify
  const testFailed = check_values(res, vcat_name, product_id);

  if (testFailed) return;

  // Check if a document with the same name and product_id already exists
  const existing_vcat = await CatProductVariation.findOne({
    Name: vcat_name.trim().toLowerCase(),
    Product_id: product_id,
  });

  if (existing_vcat) {
    return res.status(400).json({
      status: false,
      message: iwe_strings.Product.Variation.EEXISTS,
    });
  }

  // Check if the product exists
  const product = await Menu.findById(product_id);
  if (!product) {
    return res.status(400).json({
      status: false,
      message: iwe_strings.Product.ENOTFOUND,
    });
  }

  // Create the VCategory
  const newCatVariation = new CatProductVariation({
    Name: vcat_name.trim().toLowerCase(),
    Product_id: product_id,
  });

  await newCatVariation.save();
  return res.json(newCatVariation);
}

async function vcategory_delete(req: Request, res: Response) {
  // We want to delete a VCategory only if there aren't any variations associated with it
  // Note: URL is formatted as /api/admin/menu/variation/tag/:vcat_id
  const vcat_id = req.params.vcat_id;

  // Do not check what_is, as we are only deleting a VCategory
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
  const testFailed = check_values(res, "unused", vcat_id);
  if (testFailed) return;

  // Check if the vcategory exists
  const existing_category = await CatProductVariation.findById(vcat_id);
  if (!existing_category) {
    return res.status(400).json({
      status: false,
      message: iwe_strings.Product.Variation.Category.ENOTFOUND,
    });
  }

  // Check if there are any variations associated with this VCategory
  const existing_variation = await ProductVariation.findOne({
    VCategory_id: vcat_id,
  });

  if (existing_variation) {
    return res.status(400).json({
      status: false,
      message: iwe_strings.Product.Variation.Category.EHASVARIATION,
    });
  }

  // Delete the VCategory
  await CatProductVariation.findByIdAndDelete(vcat_id);

  return res.json({
    status: true,
  });
}

async function vcategory_modify(req: Request, res: Response) {
  // We want to modify a VCategory only if there aren't any variations associated with it
  // Note: URL is formatted as /api/admin/menu/variation/tag/:vcat_id
  const vcat_id = req.params.vcat_id;

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
  const [vcat_name, product_id] = wis_array(req);

  // verify (using the ID checking function)
  const testFailed = check_values(res, vcat_name, product_id);
  if (testFailed) return;
  const vcatFailed = check_values(res, "unused", vcat_id);
  if (vcatFailed) return;

  // Check if a document with the same name and product_id already exists
  const existing_vcat = await CatProductVariation.findById(vcat_id);

  if (!existing_vcat) {
    return res.status(404).json({
      status: false,
      message: iwe_strings.Product.Variation.ENOTFOUND,
    });
  }

  const duplicate_vcat = await CatProductVariation.findOne({
    Name: vcat_name.trim().toLowerCase(),
  });

  if (duplicate_vcat) {
    if (duplicate_vcat._id.toString() === existing_vcat._id.toString()) {
      return res.status(400).json({
        status: false,
        message: iwe_strings.Product.Variation.Category.EISEXACT,
      });
    }
    return res.status(400).json({
      status: false,
      message: iwe_strings.Product.Variation.Category.EEXISTS,
    });
  }

  // Check if the product exists
  const product = await Menu.findById(product_id);
  if (!product) {
    return res.status(400).json({
      status: false,
      message: iwe_strings.Product.ENOTFOUND,
    });
  }

  if (vcat_name.trim() != "") {
    existing_vcat.Name = vcat_name.trim().toLowerCase();
  }

  if (product_id) {
    existing_vcat.Product_id = product_id;
  }

  await existing_vcat.save();
  return res.json(existing_vcat);
}

function check_values(
  res: Response,
  vcat_name: string,
  product_id: string
  //OTHER ...
) {
  if (
    vcat_name.trim() === "" ||
    product_id.trim() === "" ||
    !mongoose.Types.ObjectId.isValid(product_id) ||
    typeof vcat_name != "string" ||
    typeof product_id != "string"
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  return 0;
}
export { vcategory_create, vcategory_delete, vcategory_modify };
