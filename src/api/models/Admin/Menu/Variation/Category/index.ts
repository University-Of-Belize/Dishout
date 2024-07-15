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

async function vcategory_delete(req: Request, res: Response) {}

async function vcategory_modify(req: Request, res: Response) {}

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
