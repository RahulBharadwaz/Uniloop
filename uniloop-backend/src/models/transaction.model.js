import mongoose, { Schema } from "mongoose";

const transactionSchema = new Schema(
    {
        item: {
            type: Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },
        request: {
            type: Schema.Types.ObjectId,
            ref: "Request",
            required: true
        },
        requester: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'ACCEPTED', 'AGREEMENT_PROPOSED', 'ACTIVE', 'RETURN_PENDING', 'COMPLETED', 'DISPUTED', 'CANCELLED'],
            default: 'ACCEPTED'
        },
        mode: {
            type: String,
            enum: ['RENT', 'SELL', 'GIVE']
        },
        agreedPrice: {
            type: Number,
            default: 0
        },
        agreedDuration: {
            type: Number
        },
        terms: {
            type: String
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        actualReturnDate: {
            type: Date
        },
        disputeReason: {
            type: String
        },
        disputeRaisedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        disputeDate: {
            type: Date
        }
    },
    {
        timestamps: true
    }
)

export const Transaction = mongoose.model("Transaction", transactionSchema)
