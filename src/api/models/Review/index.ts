import { Request, Response } from "express";
import Review from "../../../database/models/Reviews";
import mongoose from "mongoose";

import { ErrorFormat, iwe_strings } from "../../strings";
import { get_authorization_user } from "../../utility/Authentication";
import what from "../../utility/Whats";
import { wis_array, what_is } from "../../utility/What_Is";

async function review_create(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.public.review) {
    // Two underscores means it's an admin function
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }

  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }
  // Extract information from the request body
  const [productId, rating, content] = wis_array(req);

  // Create a new review
  const newReview = await Review.create({
    // @ts-ignore
    reviewer: user._id,
    rating: rating,
    content: content,
    productId: new mongoose.Types.ObjectId(productId),
  });

  // Return the new review as a JSON response
  return res.json(what_is(what.public.review, newReview));
}
export { review_create };
