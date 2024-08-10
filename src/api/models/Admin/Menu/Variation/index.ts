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
  const [variation_name, category_id, cycle_on] = wis_array(req);

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

  type CyclesOnValue =
    | "MON"
    | "TUE"
    | "WED"
    | "THU"
    | "FRI"
    | "SAT"
    | "SUN"
    | "MON-TUE"
    | "MON-TUE-WED"
    | "MON-TUE-WED-THU"
    | "MON-WED"
    | "MON-WED-THU"
    | "MON-THU"
    | "MON-FRI"
    | "MON-SAT"
    | "MON-SUN"
    | "TUE-WED"
    | "TUE-WED-THU"
    | "TUE-THU"
    | "TUE-FRI"
    | "TUE-SAT"
    | "TUE-SUN"
    | "WED-THU"
    | "WED-THU-FRI"
    | "WED-FRI"
    | "WED-SAT"
    | "WED-SUN"
    | "THU-FRI"
    | "THU-FRI-SAT"
    | "THU-SAT"
    | "THU-SUN"
    | "FRI-SAT"
    | "FRI-SAT-SUN"
    | "FRI-SUN"
    | "SAT-SUN"
    | "MON-TUE-THU"
    | "MON-TUE-FRI"
    | "MON-TUE-SAT"
    | "MON-TUE-SUN"
    | "MON-WED-FRI"
    | "MON-WED-SAT"
    | "MON-WED-SUN"
    | "MON-THU-FRI"
    | "MON-THU-SAT"
    | "MON-THU-SUN"
    | "MON-FRI-SAT"
    | "MON-FRI-SUN"
    | "MON-SAT-SUN"
    | "TUE-WED-FRI"
    | "TUE-WED-SAT"
    | "TUE-WED-SUN"
    | "TUE-THU-FRI"
    | "TUE-THU-SAT"
    | "TUE-THU-SUN"
    | "TUE-FRI-SAT"
    | "TUE-FRI-SUN"
    | "TUE-SAT-SUN"
    | "WED-THU-SAT"
    | "WED-THU-SUN"
    | "WED-FRI-SAT"
    | "WED-FRI-SUN"
    | "WED-SAT-SUN"
    | "THU-SAT-SUN"
    | "MON-TUE-THU-FRI"
    | "MON-TUE-THU-SAT"
    | "MON-TUE-THU-SUN"
    | "MON-TUE-FRI-SAT"
    | "MON-TUE-FRI-SUN"
    | "MON-TUE-SAT-SUN"
    | "MON-WED-THU-FRI"
    | "MON-WED-THU-SAT"
    | "MON-WED-THU-SUN"
    | "MON-WED-FRI-SAT"
    | "MON-WED-FRI-SUN"
    | "MON-WED-SAT-SUN"
    | "MON-THU-FRI-SAT"
    | "MON-THU-FRI-SUN"
    | "MON-THU-SAT-SUN"
    | "MON-FRI-SAT-SUN"
    | "TUE-WED-THU-FRI"
    | "TUE-WED-THU-SAT"
    | "TUE-WED-THU-SUN"
    | "TUE-WED-FRI-SAT"
    | "TUE-WED-FRI-SUN"
    | "TUE-WED-SAT-SUN"
    | "TUE-THU-FRI-SAT"
    | "TUE-THU-FRI-SUN"
    | "TUE-THU-SAT-SUN"
    | "TUE-FRI-SAT-SUN"
    | "WED-THU-FRI-SAT"
    | "WED-THU-FRI-SUN"
    | "WED-THU-SAT-SUN"
    | "WED-FRI-SAT-SUN"
    | "THU-FRI-SAT-SUN"
    | "MON-TUE-THU-FRI-SAT"
    | "MON-TUE-THU-FRI-SUN"
    | "MON-TUE-THU-SAT-SUN"
    | "MON-TUE-FRI-SAT-SUN"
    | "MON-WED-THU-FRI-SAT"
    | "MON-WED-THU-FRI-SUN"
    | "MON-WED-THU-SAT-SUN"
    | "MON-WED-FRI-SAT-SUN"
    | "MON-THU-FRI-SAT-SUN"
    | "TUE-WED-THU-FRI-SAT"
    | "TUE-WED-THU-FRI-SUN"
    | "TUE-WED-THU-SAT-SUN"
    | "TUE-WED-FRI-SAT-SUN"
    | "TUE-THU-FRI-SAT-SUN"
    | "WED-THU-FRI-SAT-SUN";
  let cycles_on: CyclesOnValue | undefined;

  // Check if 'cycle_on' is either EXACTLY 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'
  if (
    ![
      "MON",
      "TUE",
      "WED",
      "THU",
      "FRI",
      "SAT",
      "SUN",
      "MON-TUE",
      "MON-TUE-WED",
      "MON-TUE-WED-THU",
      "MON-WED",
      "MON-WED-THU",
      "MON-THU",
      "MON-FRI",
      "MON-SAT",
      "MON-SUN",
      "TUE-WED",
      "TUE-WED-THU",
      "TUE-THU",
      "TUE-FRI",
      "TUE-SAT",
      "TUE-SUN",
      "WED-THU",
      "WED-THU-FRI",
      "WED-FRI",
      "WED-SAT",
      "WED-SUN",
      "THU-FRI",
      "THU-FRI-SAT",
      "THU-SAT",
      "THU-SUN",
      "FRI-SAT",
      "FRI-SAT-SUN",
      "FRI-SUN",
      "SAT-SUN",
      "MON-TUE-THU",
      "MON-TUE-FRI",
      "MON-TUE-SAT",
      "MON-TUE-SUN",
      "MON-WED-FRI",
      "MON-WED-SAT",
      "MON-WED-SUN",
      "MON-THU-FRI",
      "MON-THU-SAT",
      "MON-THU-SUN",
      "MON-FRI-SAT",
      "MON-FRI-SUN",
      "MON-SAT-SUN",
      "TUE-WED-FRI",
      "TUE-WED-SAT",
      "TUE-WED-SUN",
      "TUE-THU-FRI",
      "TUE-THU-SAT",
      "TUE-THU-SUN",
      "TUE-FRI-SAT",
      "TUE-FRI-SUN",
      "TUE-SAT-SUN",
      "WED-THU-SAT",
      "WED-THU-SUN",
      "WED-FRI-SAT",
      "WED-FRI-SUN",
      "WED-SAT-SUN",
      "THU-SAT-SUN",
      "MON-TUE-THU-FRI",
      "MON-TUE-THU-SAT",
      "MON-TUE-THU-SUN",
      "MON-TUE-FRI-SAT",
      "MON-TUE-FRI-SUN",
      "MON-TUE-SAT-SUN",
      "MON-WED-THU-FRI",
      "MON-WED-THU-SAT",
      "MON-WED-THU-SUN",
      "MON-WED-FRI-SAT",
      "MON-WED-FRI-SUN",
      "MON-WED-SAT-SUN",
      "MON-THU-FRI-SAT",
      "MON-THU-FRI-SUN",
      "MON-THU-SAT-SUN",
      "MON-FRI-SAT-SUN",
      "TUE-WED-THU-FRI",
      "TUE-WED-THU-SAT",
      "TUE-WED-THU-SUN",
      "TUE-WED-FRI-SAT",
      "TUE-WED-FRI-SUN",
      "TUE-WED-SAT-SUN",
      "TUE-THU-FRI-SAT",
      "TUE-THU-FRI-SUN",
      "TUE-THU-SAT-SUN",
      "TUE-FRI-SAT-SUN",
      "WED-THU-FRI-SAT",
      "WED-THU-FRI-SUN",
      "WED-THU-SAT-SUN",
      "WED-FRI-SAT-SUN",
      "THU-FRI-SAT-SUN",
      "MON-TUE-THU-FRI-SAT",
      "MON-TUE-THU-FRI-SUN",
      "MON-TUE-THU-SAT-SUN",
      "MON-TUE-FRI-SAT-SUN",
      "MON-WED-THU-FRI-SAT",
      "MON-WED-THU-FRI-SUN",
      "MON-WED-THU-SAT-SUN",
      "MON-WED-FRI-SAT-SUN",
      "MON-THU-FRI-SAT-SUN",
      "TUE-WED-THU-FRI-SAT",
      "TUE-WED-THU-FRI-SUN",
      "TUE-WED-THU-SAT-SUN",
      "TUE-WED-FRI-SAT-SUN",
      "TUE-THU-FRI-SAT-SUN",
      "WED-THU-FRI-SAT-SUN",
    ].includes(cycle_on)
  ) {
    cycles_on = undefined;
  }
  cycles_on = cycle_on;
  if (cycles_on) {
    //     Cycles_on: cycles_on,
    existing_variation.Cycles_on = cycles_on;
  }

  await existing_variation.save();
  return res.json([iwe_strings.Product.Variation.IMODIFY, existing_variation]);
}

function check_values(
  res: Response,
  variation_name: string,
  category_id: string
  //OTHER ...
) {
  if (
    typeof variation_name != "string" ||
    typeof category_id != "string" ||
    variation_name.trim() === "" ||
    category_id.trim() === "" ||
    !mongoose.Types.ObjectId.isValid(category_id)
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  return 0;
}

export {
  variation_create as vmenu_create,
  variation_delete as vmenu_delete,
  variation_modify as vmenu_modify
};

