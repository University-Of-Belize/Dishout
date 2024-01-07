import { Request, Response } from "express";
import Review from "../../../database/models/Reviews";
import Product from "../../../database/models/Products";
import ProductResearch from "../../../database/models/research/ProductData";
import mongoose from "mongoose";
import Filter from "bad-words";

import { ErrorFormat, iwe_strings } from "../../strings";
import { get_authorization_user } from "../../utility/Authentication";
import what from "../../utility/Whats";
import settings from "../../../config/settings.json";
import { wis_array, what_is } from "../../utility/What_Is";

/***** BAD WORDS FILTER *****/
const filter = new Filter();
filter.removeWords(...settings.server.excludedBadWords); // https://www.npmjs.com/package/bad-words#remove-words-from-the-blacklist
/************************** */

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

  // Check if productId is a valid MongoDB ObjectId
  if (
    typeof productId != "string" ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Check if productId corresponds to an existing Product
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json(ErrorFormat(iwe_strings.Review.EPRODNOEXISTS));
  }

  // Check if rating is a valid integer
  if (!Number.isInteger(rating)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Check if content is a string
  if (typeof content !== "string") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Check if rating is a valid integer between 1 and 5
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json(ErrorFormat(iwe_strings.Review.ERANGEERROR));
  }

  // Create a new review
  const newReview = await Review.create({
    // @ts-ignore
    reviewer: user._id,
    rating: rating,
    content: filter.clean(content),
    original_content: content,
    product: productId,
    // By request: Hide reviews that are profane automatically
    hidden: filter.isProfane(content),
  });

  // Data to track
  let productresearch = await ProductResearch.findOne({ product });
  if (!productresearch) {
    productresearch = await ProductResearch.create({ product });
  }
  productresearch.reviews += 1;
  // Attach it to the product
  // @ts-ignore
  product.reviews.push(newReview);

  await product.save();
  await newReview.save();
  await productresearch.save();
  // Return the new review as a JSON response
  return res.json(
    what_is(what.public.review, [
      filter.isProfane(content)
        ? iwe_strings.Review.WPROFFOUND
        : iwe_strings.Review.ICREATE,
      newReview,
    ])
  );
}
export { review_create };
