import mongoose, { Schema } from "mongoose";
import { productsSchema } from "./Products";
const SchemaTypes = mongoose.Schema.Types;

const usersSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true,  // Can't have the same ID, otherwise that would be weird
  },
  username: {
    type: String,
    required: true,
    unique: true,  // Can't have the same username, otherwise that would be confusing
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,  // Can't have the same email, otherwise that would be stupid
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
    type: [productsSchema],
    required: true,
    default: [],
  },
  activation_token: {
    type: String,
    required: false,
    unique: true,  // Can't have the same activation token, otherwise we would be able to activate two accounts at the same time
  },
  token: {
    type: String,
    required: false,
    unique: true,  // Can't have the same user token, otherwise that would mean there would be an authentication overlap
  },
  reset_token: {
    type: String,
    required: false,
    unique: true, // Can't have the same reset token
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
