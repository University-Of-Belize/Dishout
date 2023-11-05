import mongoose, { Schema } from "mongoose";
import settings from "../../config/settings.json";
const SchemaTypes = mongoose.Schema.Types;

const reviewsSchema = new Schema({
  // MongoDB generates IDs by default
  content: {
    type: String,
    required: true,
  },
  original_content: {
    type: String,
    required: true,
  },
  rating: {
    // 1...5
    type: Number,
    max: [5, "The value of path `{PATH}` ({VALUE}) exceeds the limit ({MAX})."],
    min: [
      1,
      "The value of path `{PATH}` ({VALUE}) is less than the limit ({MIN}).",
    ],
    required: true,
  },
  reviewer: {
    type: SchemaTypes.ObjectId,
    ref: "Users",
    required: true,
    default: settings.server.defaultReviewer,
  },
  hidden: {
    type: Boolean,
    required: true,
    default: false,
  },
  product: {
    type: SchemaTypes.ObjectId,
    ref: "Products",
    required: true,
  },
});
export default mongoose.model("Reviews", reviewsSchema);
export { reviewsSchema };
