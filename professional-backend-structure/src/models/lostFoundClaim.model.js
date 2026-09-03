import mongoose, { Schema } from "mongoose";

const lostFoundClaimSchema = new Schema(
    {
        post: {
            type: Schema.Types.ObjectId,
            ref: 'LostFound',
            required: true
        },
        claimant: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        postOwner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        claimType: {
            type: String,
            enum: ['I_FOUND_IT', 'ITS_MINE'],
            required: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'VERIFICATION', 'VERIFIED', 'REJECTED', 'RESOLVED', 'CANCELLED'],
            default: 'PENDING'
        },
        message: {
            type: String,
            required: true
        },
        verificationAnswers: [{
            questionId: String,
            answer: String
        }],
        verificationScore: {
            type: Number,
            default: 0
        },
        proofPhotos: [String],
        locationFound: String,
        dateFound: Date,
        chatEnabled: {
            type: Boolean,
            default: false
        },
        meetupDetails: {
            proposedLocation: String,
            proposedTime: Date,
            agreedLocation: String,
            agreedTime: Date,
            status: {
                type: String,
                enum: ['NOT_SET', 'PROPOSED', 'AGREED', 'COMPLETED'],
                default: 'NOT_SET'
            }
        },
        ownerNotes: String,
        timeline: [{
            action: String,
            by: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            details: String
        }]
    },
    {
        timestamps: true
    }
);

lostFoundClaimSchema.index({ post: 1, claimant: 1 }, { unique: true });
lostFoundClaimSchema.index({ postOwner: 1 });
lostFoundClaimSchema.index({ status: 1 });

export const LostFoundClaim = mongoose.model("LostFoundClaim", lostFoundClaimSchema);
