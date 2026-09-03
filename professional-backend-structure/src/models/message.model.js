import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        transaction: {
            type: Schema.Types.ObjectId,
            ref: "Transaction",
            required: true,
            index: true
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }
)

messageSchema.index({ transaction: 1, timestamp: 1 })

export const Message = mongoose.model("Message", messageSchema)
