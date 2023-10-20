import mongoose, { Schema } from "mongoose";
import Users from "./Users";
import Promos from "./Promos";
const SchemaTypes = mongoose.Schema.Types;

const ordersSchema = new Schema({
  // MongoDB sorts out IDs by default
  order_from: {
    ref: Users,
    required: true,
  },
  override_by: {
    ref: Users,
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
    ref: Promos,
    required: false,
  },
  is_accepted: {
    type: Boolean,
    required: true,
    default: 0, // Queued by default. -1 for declined, 1 for accepted
  },
  delay_time: {
    type: Number,  // Seconds
    required: true,
    default: 0, // No delay
  },
});
export default mongoose.model("Orders", ordersSchema);
export { ordersSchema };
