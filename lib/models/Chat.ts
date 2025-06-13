import mongoose from "mongoose";

export interface IChat extends mongoose.Document {
  participants: mongoose.Types.ObjectId[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  admin?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
    },
    groupAvatar: {
      type: String,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastActivity: -1 });

export default mongoose.models.Chat ||
  mongoose.model<IChat>("Chat", ChatSchema);
