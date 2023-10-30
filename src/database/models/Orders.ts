import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;

const ordersSchema = new Schema({
  // MongoDB generates IDs by default
  order_code: {
    type: String,
    required: true, // Randomly chosen by the backend. UUIDv4
    unique: true, // Two order codes must not be the same
  },
  order_from: {
    type: SchemaTypes.ObjectId,
    ref: "Users",
    required: true,
  },
  override_by: {
    type: SchemaTypes.ObjectId,
    ref: "Users",
    required: false,
  },
  order_date: {
    type: Number,
    required: true,
  },
  total_amount: {
    type: SchemaTypes.Decimal128,
    required: true,
    default: 0.0,
  },
  promo_code: {
    type: SchemaTypes.ObjectId,
    ref: "Promos",
    required: false,
  },
  is_accepted: {
    type: Boolean,
    required: true,
    default: 0, // Queued by default. -1 for declined, 1 for accepted
  },
  delay_time: {
    type: Number, // Seconds
    required: true,
    default: 0, // No delay
  },
});
export default mongoose.model("Orders", ordersSchema);
export { ordersSchema };
