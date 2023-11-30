import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;

const categoriesSchema = new Schema({
  // MongoDB generates IDs by default
  name: {
    type: String,
    required: true,
    unique: true,
  },
  alias: {
    type: String,
    required: false,
    unique: false, // Set unique to false // Neither that (forcing User Interface choices through the backend, I know, lol)
    sparse: true, // Add this line to make the index sparse
  },
  description: {
    // Probably only shown to staff
    type: String,
    required: true,
  },
  // image: {
  //   type: String,
  //   required: true,
  // },
  hidden: {
    type: Boolean,
    required: true,
    default: false,
  },
});
export default mongoose.model("Categories", categoriesSchema);
export { categoriesSchema };
