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
    required: false, // We should not accept orders by default. Undefined means queued
    // Queued by default. false for declined, true for accepted
  },
  delay_time: { // When will the product be delivered?
    type: Number, // Seconds
    required: true,
    default: 0, // No delay
  },
  products: {
    type: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Products" },
        quantity: Number,
      },
    ], // Users don't have to have a cart. The cart is always cleared after orders are complete
    required: false,
  },
});
export default mongoose.model("Orders", ordersSchema);
export { ordersSchema };
