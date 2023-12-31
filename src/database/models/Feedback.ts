import mongoose, { Schema } from "mongoose";
import settings from "../../config/settings.json";
const SchemaTypes = mongoose.Schema.Types;

const feedbackSchema = new Schema({
  // MongoDB generates IDs by default
  content: {
    type: String,
    required: true,
  },
  original_content: {
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
export default mongoose.model("Feedback", feedbackSchema);
export { feedbackSchema };
