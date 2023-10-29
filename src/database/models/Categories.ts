import mongoose, { Schema } from "mongoose";
// const SchemaTypes = mongoose.Schema.Types;

const categoriesSchema = new Schema({
  // MongoDB adds IDs by default
  name: {
    type: String,
    required: true,
  },
  alias: {
    type: String,
    required: false
  },
  description: {   // Probably only shown to staff
    type: String,
    required: true
  },
  hidden: {
    type: Boolean,
    required: true,
    default: false
  }
});
export default mongoose.model("Categories", categoriesSchema);
export { categoriesSchema };
