import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;

const productResearch = new Schema({
  // MongoDB generates IDs by default
  // This is the reference to the product we're researching
  product: { // Implemented
    type: SchemaTypes.ObjectId,
    ref: "Products",
    unique: true, // Can't have two of the same URLs
  },
  // Data we want to store and display later
  // This is the number of times a product has been viewed
  views: { // Implemented
    type: Number,
    required: true,
    default: 0,
  },
  // This is the number of times a product has been added to the cart
  carted: { // Implemented
    type: Number,
    required: true,
    default: 0,
  },
  // This is the number of times a product has been added to the cart
  uncarted: {
    type: Number,
    required: true,
    default: 0,
  },
  // This is the number of times a product has been purchased
  purchased: { // Implemented
    type: Number,
    required: true,
    default: 0,
  },
  // This is the number of times a product has been reviewed
  reviews: { // Implemented
    type: Number,
    required: true,
    default: 0,
  },
  // This is the number of times a product has been rated
  rated: { // Unused
    type: Number,
    required: true,
    default: 0,
  },
  // This is the number of times a product has been shared
  shared: { // Unused
    type: Number,
    required: true,
    default: 0,
  },
  // This is the number of times a product has been added to a wishlist
  wishlist: { // Unused
    type: Number,
    required: true,
    default: 0,
  },
  // This is the number of times a product has been added to a collection
  collected: { // Unused
    type: Number,
    required: true,
    default: 0,
  },
});
export default mongoose.model("product-research", productResearch);
export { productResearch as productResearchSchema };
