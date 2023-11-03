import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;

const menuSchema = new Schema({
  // MongoDB generates IDs by default
  slug: {
    type: String, // To display the product page we need a slug
    required: true,
    unique: true, // Can't have two of the same URLS
  },
  productName: {
    type: String,
    required: true,
    unique: true, // Nope, not gonna allow that
  },
  price: {
    type: SchemaTypes.Decimal128,
    required: true,
    default: 0.0,
  },
  image: {
    type: String, // URL
    required: false,
    default: "",
  },
  in_stock: {
    type: Number, // How many items do we have in-stock at the given moment?
    required: true,
    default: 0, // Nada
  },
  description: {
    type: String,
    required: false,
  },
  category: {
    type: SchemaTypes.ObjectId,
    ref: "Categories",
    required: true,
  },
  reviews: {
    type: [{ type: Schema.Types.ObjectId, ref: "Reviews" }], // IDs of all reviews ever created on a product
    required: false,
  },
});
export default mongoose.model("Products", menuSchema);
export { menuSchema as productsSchema };
