import mongoose, { Schema } from "mongoose";

const claimChatSchema = new Schema(
    {
        claim: {
            type: Schema.Types.ObjectId,
            ref: 'LostFoundClaim',
            required: true,
            index: true
        },
        participants: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        lastMessage: {
            content: String,
            sender: { type: Schema.Types.ObjectId, ref: 'User' },
            timestamp: Date
        },
        isActive: {
            type: Boolean,
            default: true
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

claimChatSchema.index({ participants: 1 });
claimChatSchema.index({ claim: 1, participants: 1 });

const claimMessageSchema = new Schema(
    {
        chat: {
            type: Schema.Types.ObjectId,
            ref: 'ClaimChat',
            required: true,
            index: true
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String
        },
        messageType: {
            type: String,
            enum: ['TEXT', 'IMAGE', 'LOCATION', 'MEETUP_PROPOSAL', 'VERIFICATION_REQUEST', 'SYSTEM'],
            default: 'TEXT'
        },
        metadata: {
            imageUrl: String,
            location: {
                name: String,
                coordinates: {
                    lat: Number,
                    lng: Number
                }
            },
            meetup: {
                location: String,
                time: Date
            }
        },
        readBy: [{
            user: { type: Schema.Types.ObjectId, ref: 'User' },
            readAt: Date
        }],
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: Date
    },
    {
        timestamps: true
    }
);

claimMessageSchema.index({ chat: 1, createdAt: -1 });

export const ClaimChat = mongoose.model("ClaimChat", claimChatSchema);
export const ClaimMessage = mongoose.model("ClaimMessage", claimMessageSchema);
