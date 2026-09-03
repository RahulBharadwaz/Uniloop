import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema(
    {
        requester: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        item: {
            type: Schema.Types.ObjectId,
            ref: "Item"
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        image: {
            type: String
        },
        status: {
            type: String,
            enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COUNTER_OFFERED', 'COMPLETED'],
            default: 'PENDING'
        },
        matchedOwners: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        requestType: {
            type: String,
            enum: ['STANDARD', 'INSTANT_CLAIM', 'COUNTER_OFFER'],
            default: 'STANDARD'
        },
        proposedPrice: Number,
        proposedDuration: {
            startDate: Date,
            endDate: Date,
            days: Number
        },
        counterOffer: {
            price: Number,
            duration: {
                startDate: Date,
                endDate: Date,
                days: Number
            },
            message: String,
            proposedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            status: {
                type: String,
                enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
                default: 'PENDING'
            }
        },
        negotiationHistory: [{
            type: {
                type: String,
                enum: ['INITIAL', 'COUNTER', 'ACCEPT', 'REJECT']
            },
            price: Number,
            duration: Object,
            message: String,
            by: { type: Schema.Types.ObjectId, ref: 'User' },
            timestamp: { type: Date, default: Date.now }
        }],
        pickupDetails: {
            location: String,
            proposedTime: Date,
            confirmedTime: Date,
            instructions: String
        },
        priority: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
)

export const Request = mongoose.model("Request", requestSchema)
