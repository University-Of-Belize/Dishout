// @audit Required for DotCom

import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;

const catVariationSchema = new Schema({
  // MongoDB generates IDs by default
  Name: {
    type: String,
    required: true,
    unique: true, // Nope, not gonna allow that
  },
  Product_id: {
    type: SchemaTypes.ObjectId,
    ref: "Product",
    required: true,
  }
});
export default mongoose.model("CatProductVariations", catVariationSchema);
export { catVariationSchema };
