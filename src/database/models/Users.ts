import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;

const usersSchema = new Schema({
  // MongoDB generates IDs by default
  id: {
    type: Number,
    required: true,
    unique: true, // Can't have the same ID, otherwise that would be weird
  },
  username: {
    type: String,
    required: true,
    unique: true, // Can't have the same username, otherwise that would be confusing
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Can't have the same email, otherwise that would be stupid
  },
  staff: {
    type: Boolean,
    required: true,
    default: false,
  },
  credit: {
    type: SchemaTypes.Decimal128,
    required: true,
    default: 0.0,
  },
  cart: {
    type: [{{ type: Schema.Types.ObjectId, ref: "Products" }, {type: Number}}],  // Users don't have to have a cart. The cart is always cleared after orders are complete
    // Cart: [{product, quantity}]
    required: false,
  },
  activation_token: {
    type: String,
    required: false,
  },
  token: {
    type: String,
    required: false,
  },
  reset_token: {
    type: String,
    required: false,
  },
  restrictions: {
    type: Number,
    required: true,
    default: 0, // No restrictions
  },
});
export default mongoose.model("Users", usersSchema);
export { usersSchema };

/*
# Restriction table

-1 - Banned
0 - None
1 - Temporarily disabled
2 - Ordering Only
3 - Website in read only mode
4 - Temporary administrator
5 - Reserved for future use
*/
