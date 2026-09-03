import mongoose, { Schema } from "mongoose";

const offerSchema = new Schema({
    offerer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    offerType: {
        type: String,
        enum: ['FREE', 'SELL', 'RENT'],
        required: true
    },
    price: Number,
    photos: [String],
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
        default: 'PENDING'
    },
    chatEnabled: { type: Boolean, default: false }
}, { timestamps: true });

const wantedItemSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
        type: String,
        enum: ['Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Kitchen', 'Tools', 'Other'],
        required: true
    },
    referenceImage: String,
    budget: {
        type: { type: String, enum: ['ANY', 'FREE_ONLY', 'MAX_PRICE'], default: 'ANY' },
        maxAmount: Number
    },
    urgency: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    quantity: { type: Number, default: 1 },
    preferredCondition: {
        type: String,
        enum: ['ANY', 'NEW', 'LIKE_NEW', 'GOOD', 'FAIR'],
        default: 'ANY'
    },
    status: {
        type: String,
        enum: ['OPEN', 'FULFILLED', 'CLOSED', 'EXPIRED'],
        default: 'OPEN'
    },
    offers: [offerSchema],
    acceptedOffer: { type: Schema.Types.ObjectId },
    fulfilledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    expiresAt: Date,
    viewCount: { type: Number, default: 0 },
    collegeDomain: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    }
}, { timestamps: true });

export const WantedItem = mongoose.model("WantedItem", wantedItemSchema);
