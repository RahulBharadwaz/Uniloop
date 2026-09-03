import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: [
                // Transaction notifications
                'REQUEST_RECEIVED', 
                'REQUEST_ACCEPTED', 
                'REQUEST_REJECTED', 
                'AGREEMENT_PROPOSED', 
                'AGREEMENT_CONFIRMED', 
                'RETURN_PENDING', 
                'TRANSACTION_COMPLETED', 
                'DISPUTE_RAISED', 
                'NEW_MESSAGE', 
                'REMINDER', 
                'OVERDUE',
                // Lost & Found notifications
                'LOST_FOUND_CLAIM',
                'LOST_FOUND_VERIFICATION',
                'LOST_FOUND_VERIFIED',
                'LOST_FOUND_REJECTED',
                'LOST_FOUND_MEETUP',
                'LOST_FOUND_MEETUP_ACCEPTED',
                'LOST_FOUND_RESOLVED',
                'LOST_FOUND_MESSAGE',
                // Wanted Items notifications
                'WANTED_OFFER_RECEIVED',
                'WANTED_OFFER_ACCEPTED',
                'WANTED_OFFER_REJECTED',
                'WANTED_OFFER_MESSAGE',
                'WANTED_FULFILLED'
            ],
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        relatedTransaction: {
            type: Schema.Types.ObjectId,
            ref: "Transaction"
        },
        relatedRequest: {
            type: Schema.Types.ObjectId,
            ref: "Request"
        },
        relatedClaim: {
            type: Schema.Types.ObjectId,
            ref: "LostFoundClaim"
        },
        relatedLostFound: {
            type: Schema.Types.ObjectId,
            ref: "LostFound"
        },
        relatedOffer: {
            type: Schema.Types.ObjectId
        },
        relatedWantedItem: {
            type: Schema.Types.ObjectId,
            ref: "WantedItem"
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

export const Notification = mongoose.model("Notification", notificationSchema)
