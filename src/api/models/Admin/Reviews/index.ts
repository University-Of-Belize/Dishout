import { Request, Response } from "express";
// Import the review
import Review from "../../../../database/models/Reviews";
import what from "../../../utility/Whats";
import { iwe_strings, ErrorFormat } from "../../../strings";
// Generic batch request
import { delete_object, list_object } from "../../../utility/batchRequest";
import { get_authorization_user } from "../../../utility/Authentication";
import { wis_array } from "../../../utility/What_Is";
import mongoose from "mongoose";

async function review_list(req: Request, res: Response) {
  await list_object(req, res, Review, what.private.review, false, true);
}
async function review_delete(req: Request, res: Response) {
  await delete_object(
    req,
    res,
    Review,
    "_id",
    what.private.review,
    iwe_strings.Review.ENOTFOUND,
  );
}

async function review_modify(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.review) {
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
  const [id, rating, comment] = wis_array(req);

  // We don't have a check_values here because, we're cdoing a comparison in only one function; not multiple
  // Check if ID is a valid string/ObjectId
  if (typeof id != "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Check if rating is a valid integer
  if (rating !== undefined && !Number.isInteger(rating)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Check if comment is a string
  if (comment !== undefined && typeof comment !== "string") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Find the review by its ID
  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json(ErrorFormat(iwe_strings.Review.ENOTFOUND));
  }

  // Is this person a staff member?
  // @ts-ignore
  if (!user.staff && !review.reviewer.equals(user._id)) {
    // Give users some access too
    return res.status(403).json(ErrorFormat(iwe_strings.Review.EUNAUTHORIZED));
  }
  // Update the review's rating and comment if they were provided
  if (rating !== undefined) {
    review.rating = rating;
  }
  if (comment !== undefined) {
    review.content = comment;
  }

  // Save the updated review
  await review.save();

  // Return the updated review as a JSON response
  return res.json(review);
}

export { review_list, review_delete, review_modify };
