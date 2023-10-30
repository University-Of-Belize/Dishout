import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;

const promosSchema = new Schema({
  // MongoDB generates IDs by default
  // Promo Code
  code: {
    type: String,
    required: true, // We don't want an empty promo code
    unique: true,
  },
  nickname: {
    type: String, // Semantic nickname
    required: false,
  },
  description: {
    type: String,
    required: false, // What's this promo for?
  },
  discount_percentage: {
    type: Number,
    required: true,
  },
  start_date: {
    type: Number,
    required: true, // When does this promo start?
  },
  expiry_date: {
    type: Number,
    required: false, // Does this promo code expire? Or is it indefinite
  },
  created_by: {
    type: SchemaTypes.ObjectId,
    ref: "Users",
    required: true, // Who created this promotional code
  },
});

export default mongoose.model("Promos", promosSchema);
export { promosSchema };
