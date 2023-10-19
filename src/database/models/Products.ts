import mongoose, { Schema } from "mongoose";
import Categories from "./Categories"
const SchemaTypes = mongoose.Schema.Types;

const menuSchema = new Schema({
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: SchemaTypes.Decimal128,
    required: true,
    default: 0.0,
  },
  image: {
    type: String,
    required: false,
    default: "",
  },
  in_stock: {
    type: Boolean,
    required: true,
    default: false,
  },
  description: {
    type: String,
    required: false,
  },
  category: {
    ref: Categories,
    required: true,
  },
});
export default mongoose.model("Menu", menuSchema);
export { menuSchema as productsSchema };
