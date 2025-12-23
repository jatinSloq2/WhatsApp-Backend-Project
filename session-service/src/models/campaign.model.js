import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    type: { type: String, enum: ["single", "bulk"], required: true },

    receiver: String,
    numbers: [String],

    message: { type: Object, required: true },

    total: { type: Number, default: 1 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },

    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Campaign", campaignSchema);