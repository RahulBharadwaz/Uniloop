import mongoose, { Schema } from "mongoose";

const offerChatMessageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['TEXT', 'IMAGE', 'LOCATION', 'MEETUP_PROPOSAL', 'SYSTEM'],
        default: 'TEXT'
    },
    content: { type: String, required: true },
    image: String,
    location: {
        address: String,
        coordinates: { lat: Number, lng: Number }
    },
    meetup: {
        location: String,
        date: Date,
        time: String,
        notes: String,
        status: {
            type: String,
            enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
            default: 'PENDING'
        }
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isEdited: { type: Boolean, default: false }
}, { timestamps: true });

const offerChatSchema = new Schema({
    wantedItem: { type: Schema.Types.ObjectId, ref: 'WantedItem', required: true },
    offer: { type: Schema.Types.ObjectId, required: true },
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    offerer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [offerChatMessageSchema],
    isActive: { type: Boolean, default: true },
    lastMessage: {
        content: String,
        sender: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: Date
    }
}, { timestamps: true });

export const OfferChat = mongoose.model("OfferChat", offerChatSchema);
