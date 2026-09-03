import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        photos: [
            {
                type: String
            }
        ],
        category: {
            type: String,
            enum: ['Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Kitchen', 'Other'],
            required: true
        },
        mode: {
            type: String,
            enum: ['RENT', 'SELL', 'GIVE'],
            required: true
        },
        price: {
            type: Number,
            validate: {
                validator: function(v) {
                    if (this.mode === 'RENT' || this.mode === 'SELL') {
                        return v != null && v >= 0;
                    }
                    return true;
                },
                message: 'Price is required for RENT and SELL modes'
            }
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        condition: {
            type: String,
            enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'],
            required: true
        },
        instantClaim: {
            type: Boolean,
            default: false
        },
        maxClaimers: {
            type: Number,
            default: 1
        },
        claimedBy: [{
            user: { type: Schema.Types.ObjectId, ref: 'User' },
            claimedAt: Date,
            status: {
                type: String,
                enum: ['PENDING_PICKUP', 'COMPLETED', 'CANCELLED'],
                default: 'PENDING_PICKUP'
            }
        }],
        rentalTerms: {
            minDays: Number,
            maxDays: Number,
            depositRequired: Boolean,
            depositAmount: Number
        },
        viewCount: { type: Number, default: 0 },
        requestCount: { type: Number, default: 0 },
        pickupLocation: String,
        availabilitySchedule: {
            type: String,
            enum: ['ANYTIME', 'WEEKDAYS', 'WEEKENDS', 'BY_APPOINTMENT'],
            default: 'ANYTIME'
        },
        collegeDomain: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true
        }
    },
    {
        timestamps: true
    }
)

export const Item = mongoose.model("Item", itemSchema)
