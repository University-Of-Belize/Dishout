// @audit Required for DotCom

import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;

const variationSchema = new Schema({
  // MongoDB generates IDs by default
  Name: {
    type: String,
    required: true,
  },
  VCategory_id: {
    type: SchemaTypes.ObjectId,
    ref: "CatProductVariation",
    required: true,
  },
  Cycles_on: {
    type: String,
    required: false,
  },
  AddOn_Fee: {
    type: SchemaTypes.Decimal128,
    required: false
  }
});
export default mongoose.model("ProductVariations", variationSchema);
export { variationSchema };
