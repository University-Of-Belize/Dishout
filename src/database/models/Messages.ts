import mongoose, { Schema } from "mongoose";
const SchemaTypes = mongoose.Schema.Types;
// const SchemaTypes = mongoose.Schema.Types;

const messagesSchema = new Schema({
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

interface Message_Obj {
    // MongoDB generates IDs by default
    subject: string;
    content: string;
};

interface Message {
    user: string;
    message: Message_Obj;
};

export default mongoose.model("Messages", messagesSchema);
export { messagesSchema };
export type { Message };
