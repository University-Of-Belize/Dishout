import mongoose, { Schema } from "mongoose";
// const SchemaTypes = mongoose.Schema.Types;

const reviewsSchema = new Schema({
  content: {
    type: String,
    required: true,
  },

  rating: { // 1...5
    type: Number,
    max: [5, 'The value of path `{PATH}` ({VALUE}) exceeds the limit ({MAX}).'],
    min: [1, 'The value of path `{PATH}` ({VALUE}) is less than the limit ({MIN}).'],
    required: true,
  },
  reviewer: {
    ref: 'Users',
    required: true,
    default: "Anonymous",
  },
  hidden: {
    type: Boolean,
    required: true,
    default: false,
  },
});
export default mongoose.model("Reviews", reviewsSchema);
export {reviewsSchema}