import mongoose, { Schema } from "mongoose";
import { productsSchema } from "./Products";
const SchemaTypes = mongoose.Schema.Types;

const usersSchema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
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
  },
});
export default mongoose.model("Users", usersSchema);
export { usersSchema };
