import mongoose, { Schema } from "mongoose";
import { usersSchema } from "./Users";
// const SchemaTypes = mongoose.Schema.Types;

const categoriesSchema = new Schema({
  // MongoDB adds IDs by default
  name: {
    type: String,
    required: true,
  },
});
export default mongoose.model("Categories", categoriesSchema);
export { categoriesSchema };
