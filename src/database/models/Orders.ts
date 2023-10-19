import mongoose, { Schema } from "mongoose";
import Users from "./Users";
const SchemaTypes = mongoose.Schema.Types;

const ordersSchema = new Schema({
  // MongoDB sorts out IDs by default
  order_from: {
    ref: Users,
    required: true,
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
});
export default mongoose.model("Orders", ordersSchema);
export { ordersSchema };
