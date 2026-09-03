import mongoose, { Schema } from "mongoose";

const agreementSchema = new Schema(
    {
        transaction: {
            type: Schema.Types.ObjectId,
            ref: "Transaction",
            required: true,
            unique: true
        },
        finalPrice: {
            type: Number,
            required: true
        },
        returnDate: {
            type: Date
        },
        notes: {
            type: String,
            trim: true
        },
        ownerConfirmed: {
            type: Boolean,
            default: false
        },
        borrowerConfirmed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

export const Agreement = mongoose.model("Agreement", agreementSchema)
