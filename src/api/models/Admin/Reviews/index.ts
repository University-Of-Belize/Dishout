import { Request, Response } from "express";
// Import the review
import Review from "../../../../database/models/Reviews";
import Product from "../../../../database/models/Products";
import what from "../../../utility/Whats";
import { iwe_strings, ErrorFormat } from "../../../strings";
// Generic batch request
import { delete_object, list_object } from "../../../utility/batchRequest";
import { get_authorization_user } from "../../../utility/Authentication";
import { what_is, wis_array, wis_string } from "../../../utility/What_Is";
import settings from "../../../../config/settings.json";
import Filter from "bad-words";
import mongoose from "mongoose";

/***** BAD WORDS FILTER *****/
const filter = new Filter();
filter.removeWords(...settings.server.excludedBadWords); // https://www.npmjs.com/package/bad-words#remove-words-from-the-blacklist
/************************** */

async function review_list(req: Request, res: Response) {
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Is this person a staff member?
  // @ts-ignore
  if (!user?.staff) {
    const userReviews = await Review.find({ reviewer: user._id });
    return res // Some overlay permitting limited access to non-staff members. We're just giving them access to themselves (must be array)
      .json(what_is(what.private.user, userReviews));
  }

  await list_object(req, res, Review, what.private.review, false, true, [
    {
      path: "reviewer",
      model: "Users",
    },
    {
      path: "product",
      model: "Products",
    },
  ]);
}
async function review_delete(req: Request, res: Response) {
  const review_id = wis_string(req);

  // Check if review_id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(review_id)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Is this person a staff member?
  // @ts-ignore
  if (!user.staff) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.ENOACCESS));
  }

  // Find the product that has this review
  const product = await Product.findOne({ reviews: review_id });

  if (product) {
    // Remove the review from the product's reviews array
    // @ts-ignore
    const index = product.reviews.indexOf(review_id);
    if (index > -1) {
      // @ts-ignore
      product.reviews.splice(index, 1);
      await product.save();
    }
  } else {
    return res.status(400).json(ErrorFormat(iwe_strings.Review.EASPNOEXIST));
  }
  // Delete the review
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

  // Check if rating is a valid integer between 1 and 5
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json(ErrorFormat(iwe_strings.Review.ERANGEERROR));
  }

  // We don't have a check_values here because, we're doing a comparison in only one function; not multiple
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
    review.content = filter.clean(comment);
    review.original_content = comment;
  }

  // Save the updated review
  await review.save();

  // Return the updated review as a JSON response
  return res.json(
    what_is(what.private.review, [
      filter.isProfane(comment)
        ? iwe_strings.Review.WPROFFOUND
        : iwe_strings.Review.IMODIFY,
      review,
    ]),
  );
}

export { review_list, review_delete, review_modify };
