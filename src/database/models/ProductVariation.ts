// @audit Required for DotCom

import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;

const variationSchema = new Schema({
  // MongoDB generates IDs by default
  Name: {
    type: String,
    required: true,
    unique: true, // Nope, not gonna allow that
  },
  VCategory_id: {
    type: SchemaTypes.ObjectId,
    ref: "CatProductVariation",
    required: true,
  }
});
export default mongoose.model("ProductVariation", variationSchema);
export { variationSchema };
