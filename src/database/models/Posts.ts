import mongoose, { Schema } from "mongoose";
import settings from "../../config/settings.json";
const SchemaTypes = mongoose.Schema.Types;

const postsSchema = new Schema({
  // MongoDB generates IDs by default
  content: {
    type: String,
    required: true,
  },
  author: {
    type: SchemaTypes.ObjectId,
    ref: "Users",
    required: true,
    default: settings.server.defaultReviewer,
  },
});
export default mongoose.model("Posts", postsSchema);
export { postsSchema };
