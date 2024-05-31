import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;
// const SchemaTypes = mongoose.Schema.Types;

const categoriesSchema = new Schema({
  // MongoDB generates IDs by default
  subject: {
    type: String,
    required: false,
  },
  content: {
    type: String,
    required: false,
    unique: false // Set unique to false // Neither that (forcing User Interface choices through the backend, I know, lol)
  },
  from_user_id: {
    type: SchemaTypes.ObjectId,
    ref: "Users",
    required: true
  },
  to_user_id: {
    type: SchemaTypes.ObjectId,
    ref: "Users",
    required: true
  }
});
export default mongoose.model("Categories", categoriesSchema);
export { categoriesSchema };
