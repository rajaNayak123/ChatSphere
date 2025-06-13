import mongoose from "mongoose";

export interface IMessage extends mongoose.Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  messageType: "Text" | "image" | "file";
  sendBy: {
    user: mongoose.Types.ObjectId;
    seenAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    sendBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        seenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ]
  },
  { timestamps: true }
);

MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);