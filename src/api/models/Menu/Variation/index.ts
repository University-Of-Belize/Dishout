import { Request, Response } from "express";
import mongoose from "mongoose";
import CatProductVariation from "../../../../database/models/CatProductVariation";
import ProductVariation from "../../../../database/models/ProductVariation";
import { ErrorFormat, iwe_strings } from "../../../strings";
import { what_is } from "../../../utility/What_Is";
import what from "../../../utility/Whats";

async function vmenu_find(req: Request, res: Response) {
  // We can also search by ID
  const id = req.params.product_id;

  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
  }

  // Get all the product variations using the product ID
  // Start from the category product variation
  const catVariation = await CatProductVariation.find({ Product_id: id });
  if (!catVariation) {
    return res.json(what_is(what.public.variation, []));
  }
  // Get all the product variations from the IDs
  let variations = await ProductVariation.find({
    VCategory_id: { $in: catVariation.map((x) => x._id) },
  });
  if (!variations || variations.length === 0) {
    variations = [];
  }

  return res.json(what_is(what.public.variation, [catVariation, variations]));
}

export { vmenu_find };
