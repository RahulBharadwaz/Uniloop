import mongoose, { Schema } from "mongoose";

const lostFoundSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: ['LOST', 'FOUND'],
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
        photo: {
            type: String
        },
        location: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            enum: ['Electronics', 'Documents', 'Accessories', 'Clothing', 'Keys', 'Bags', 'Books', 'Other'],
            required: true
        },
        status: {
            type: String,
            enum: ['OPEN', 'CLAIMED', 'VERIFIED', 'RESOLVED', 'EXPIRED'],
            default: 'OPEN'
        },
        verificationQuestions: [{
            question: String,
            answer: String
        }],
        reward: {
            offered: { type: Boolean, default: false },
            amount: Number,
            description: String
        },
        lastSeenDate: Date,
        contactPreference: {
            type: String,
            enum: ['CHAT', 'PHONE', 'EMAIL'],
            default: 'CHAT'
        },
        urgency: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            default: 'MEDIUM'
        },
        claimsCount: { type: Number, default: 0 },
        resolvedWith: { type: Schema.Types.ObjectId, ref: 'User' },
        resolvedAt: Date,
        isResolved: {
            type: Boolean,
            default: false
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

export const LostFound = mongoose.model("LostFound", lostFoundSchema)
