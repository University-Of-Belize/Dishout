import { Request, Response } from "express";
import mongoose from 'mongoose';
import Reviews from "../../../database/models/Reviews";
import { ErrorFormat, iwe_strings } from "../../strings";
import what from "../../utility/Whats";
import { what_is } from "../../utility/What_Is";

async function public_data_user_reviews(req: Request, res: Response) {
  const user_id = req.params.user_id;
  // Check if this is a valid MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  const review_obj: object[] = await Reviews.find({ reviewer: user_id }).populate([
    // { path: "reviewer", model: "Users" },
    { path: "product", model: "Products" },
  ]);

  if (!review_obj) {
    return res.status(404).json(ErrorFormat(iwe_strings.Data.ENOTFOUND));
  }

  // Return the new review as a JSON response
  return res.json(what_is(what.public.review, review_obj));
}

export { public_data_user_reviews };
