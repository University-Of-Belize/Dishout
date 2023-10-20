import mongoose, { Schema } from "mongoose";
import Users from "./Users";

const promosSchema = new Schema({
  // We're using a custom ID here because it's cool
  id: {
    type: String,
    required: true, // We don't want an empty promo code
  },
  nickname: {
    type: String, // Semantic nickname
    required: false,
  },
  description: {
    type: String,
    required: false, // What's this promo for?
  },
  expiry_date: {
    type: Number,
    required: false, // Does this promo code expire? Or is it
  },
  created_by: {
    ref: Users,
    required: true, // Who created this promotional code
  },
});

export default mongoose.model("Promos", promosSchema);
export {promosSchema}