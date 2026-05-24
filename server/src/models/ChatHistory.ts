import mongoose, { Document, Schema, Types } from 'mongoose';
import type { ChatMessageData } from '../types/index.js';

export interface IChatMessage {
  id: string;
  sender: 'user' | 'claudio';
  text: string;
  timestamp: string;
  status?: 'REPLAY' | 'PLAYING';
}

export interface IChatHistory extends Document {
  userId: Types.ObjectId;
  messages: IChatMessage[];
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: ['user', 'claudio'], required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
    status: { type: String, enum: ['REPLAY', 'PLAYING'], default: undefined },
  },
  { _id: false }
);

const ChatHistorySchema = new Schema<IChatHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    messages: [ChatMessageSchema],
  },
  { timestamps: true }
);

export const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);
