import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Request } from '../models/request.model.js';
import { Item } from '../models/item.model.js';
import { Transaction } from '../models/transaction.model.js';
import { createNotificationHelper } from './notification.controller.js';

const createRequest = asyncHandler(async (req, res) => {
    const { item: itemId, itemId: altItemId, message, description, proposedDuration, proposedPrice } = req.body;
    const finalItemId = itemId || altItemId;

    if (!finalItemId) {
        throw new ApiError(400, "Item ID is required");
    }

    const item = await Item.findById(finalItemId);

    if (!item) {
        throw new ApiError(404, "Item not found");
    }

    if (!item.isAvailable) {
        throw new ApiError(400, "Item is not available");
    }

    if (item.owner.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot request your own item");
    }

    const existingRequest = await Request.findOne({
        item: finalItemId,
        requester: req.user._id,
        status: 'PENDING'
    });

    if (existingRequest) {
        throw new ApiError(400, "You already have a pending request for this item");
    }

    const request = await Request.create({
        item: finalItemId,
        requester: req.user._id,
        owner: item.owner,
        description: description || message,
        proposedDuration,
        proposedPrice
    });

    await createNotificationHelper(
        item.owner,
        'REQUEST_RECEIVED',
        `New request for your item: ${item.title}`,
        request._id,
        'Request'
    );

    const populatedRequest = await Request.findById(request._id)
        .populate('item', 'title photos mode price')
        .populate('requester', 'fullName username avatar trustScore');

    return res.status(201).json(
        new ApiResponse(201, populatedRequest, "REQUEST CREATED SUCCESSFULLY")
    );
});

const getMyRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { requester: req.user._id };
    if (status) {
        filter.status = status;
    }

    const requests = await Request.find(filter)
        .populate('item', 'title photos mode price')
        .populate('owner', 'fullName username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Request.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "REQUESTS FETCHED SUCCESSFULLY")
    );
});

const getReceivedRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // First get all items owned by this user
    const userItems = await Item.find({ owner: req.user._id }).select('_id');
    const itemIds = userItems.map(item => item._id);

    // Find requests where owner is set OR where the item belongs to this user
    const filter = {
        $or: [
            { owner: req.user._id },
            { item: { $in: itemIds } }
        ]
    };
    if (status) {
        filter.status = status;
    }

    const requests = await Request.find(filter)
        .populate('item', 'title photos mode price')
        .populate('requester', 'fullName username avatar trustScore')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Request.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "RECEIVED REQUESTS FETCHED SUCCESSFULLY")
    );
});

const acceptRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await Request.findById(requestId).populate('item');

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    // Ensure owner is set (backward compatibility)
    if (!request.owner && request.item) {
        request.owner = request.item.owner;
        await request.save();
    }

    if (request.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to accept this request");
    }

    if (request.status !== 'PENDING') {
        throw new ApiError(400, "Request is not pending");
    }

    request.status = 'ACCEPTED';
    await request.save();

    const transactionData = {
        item: request.item._id,
        owner: request.owner,
        requester: request.requester,
        request: request._id,
        mode: request.item.mode,
        agreedPrice: Number(request.proposedPrice) || Number(request.item.price) || 0
    };
    
    // Only add agreedDuration if it's a valid number
    if (request.proposedDuration && !isNaN(Number(request.proposedDuration))) {
        transactionData.agreedDuration = Number(request.proposedDuration);
    }
    
    const transaction = await Transaction.create(transactionData);

    await Item.findByIdAndUpdate(request.item._id, { isAvailable: false });

    await createNotificationHelper(
        request.requester,
        'REQUEST_ACCEPTED',
        `Your request for "${request.item.title}" has been accepted!`,
        transaction._id,
        'Transaction'
    );

    return res.status(200).json(
        new ApiResponse(200, { request, transaction }, "REQUEST ACCEPTED SUCCESSFULLY")
    );
});

const rejectRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await Request.findById(requestId).populate('item');

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    // Ensure owner is set (backward compatibility)
    if (!request.owner && request.item) {
        request.owner = request.item.owner;
        await request.save();
    }

    if (request.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to reject this request");
    }

    if (request.status !== 'PENDING') {
        throw new ApiError(400, "Request is not pending");
    }

    request.status = 'REJECTED';
    request.rejectionReason = reason;
    await request.save();

    await createNotificationHelper(
        request.requester,
        'REQUEST_REJECTED',
        `Your request for "${request.item.title}" has been rejected`,
        request._id,
        'Request'
    );

    return res.status(200).json(
        new ApiResponse(200, request, "REQUEST REJECTED SUCCESSFULLY")
    );
});

const cancelRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await Request.findById(requestId);

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    if (request.requester.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to cancel this request");
    }

    if (request.status !== 'PENDING') {
        throw new ApiError(400, "Only pending requests can be cancelled");
    }

    request.status = 'CANCELLED';
    await request.save();

    return res.status(200).json(
        new ApiResponse(200, request, "REQUEST CANCELLED SUCCESSFULLY")
    );
});

const getActiveRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
        $or: [
            { owner: req.user._id },
            { requester: req.user._id }
        ],
        status: 'PENDING'
    };

    const requests = await Request.find(filter)
        .populate('item', 'title photos mode price')
        .populate('owner', 'fullName username avatar')
        .populate('requester', 'fullName username avatar trustScore')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Request.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "ACTIVE REQUESTS FETCHED SUCCESSFULLY")
    );
});

const instantClaim = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);

    if (!item) {
        throw new ApiError(404, "Item not found");
    }

    if (!item.instantClaim) {
        throw new ApiError(400, "This item does not support instant claim");
    }

    if (item.mode !== 'GIVE') {
        throw new ApiError(400, "Instant claim is only available for free items");
    }

    if (!item.isAvailable) {
        throw new ApiError(400, "Item is no longer available");
    }

    if (item.owner.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot claim your own item");
    }

    const existingClaim = item.claimedBy.find(
        claim => claim.user.toString() === req.user._id.toString() && claim.status !== 'CANCELLED'
    );

    if (existingClaim) {
        throw new ApiError(400, "You have already claimed this item");
    }

    const activeClaims = item.claimedBy.filter(claim => claim.status === 'PENDING_PICKUP').length;
    if (activeClaims >= item.maxClaimers) {
        throw new ApiError(400, "Maximum claimers reached for this item");
    }

    item.claimedBy.push({
        user: req.user._id,
        claimedAt: new Date(),
        status: 'PENDING_PICKUP'
    });

    if (item.claimedBy.filter(c => c.status === 'PENDING_PICKUP').length >= item.maxClaimers) {
        item.isAvailable = false;
    }

    await item.save();

    const request = await Request.create({
        item: itemId,
        requester: req.user._id,
        owner: item.owner,
        description: 'Instant claim for free item',
        requestType: 'INSTANT_CLAIM',
        status: 'ACCEPTED',
        priority: activeClaims + 1
    });

    await createNotificationHelper(
        item.owner,
        'ITEM_CLAIMED',
        `${req.user.fullName || req.user.username} has claimed your item: ${item.title}`,
        request._id,
        'Request'
    );

    return res.status(200).json(
        new ApiResponse(200, { item, request }, "ITEM CLAIMED SUCCESSFULLY")
    );
});

const getClaimQueue = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const item = await Item.findById(itemId)
        .populate('claimedBy.user', 'fullName username avatar trustScore');

    if (!item) {
        throw new ApiError(404, "Item not found");
    }

    if (item.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the owner can view the claim queue");
    }

    const queue = item.claimedBy
        .filter(claim => claim.status === 'PENDING_PICKUP')
        .sort((a, b) => a.claimedAt - b.claimedAt);

    return res.status(200).json(
        new ApiResponse(200, { queue, maxClaimers: item.maxClaimers }, "CLAIM QUEUE FETCHED SUCCESSFULLY")
    );
});

const confirmPickup = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await Request.findById(requestId).populate('item');

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    const isOwner = request.owner.toString() === req.user._id.toString();
    const isRequester = request.requester.toString() === req.user._id.toString();

    if (!isOwner && !isRequester) {
        throw new ApiError(403, "You are not authorized to confirm this pickup");
    }

    if (request.status !== 'ACCEPTED') {
        throw new ApiError(400, "Request must be accepted before confirming pickup");
    }

    request.status = 'COMPLETED';
    await request.save();

    if (request.item && request.requestType === 'INSTANT_CLAIM') {
        const item = await Item.findById(request.item._id);
        const claimIndex = item.claimedBy.findIndex(
            c => c.user.toString() === request.requester.toString()
        );
        if (claimIndex !== -1) {
            item.claimedBy[claimIndex].status = 'COMPLETED';
            await item.save();
        }
    }

    const notifyUser = isOwner ? request.requester : request.owner;
    await createNotificationHelper(
        notifyUser,
        'PICKUP_CONFIRMED',
        `Pickup confirmed for "${request.item.title}"`,
        request._id,
        'Request'
    );

    return res.status(200).json(
        new ApiResponse(200, request, "PICKUP CONFIRMED SUCCESSFULLY")
    );
});

const createCounterOffer = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { price, duration, message } = req.body;

    const request = await Request.findById(requestId).populate('item');

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    if (request.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the item owner can create a counter offer");
    }

    if (request.status !== 'PENDING' && request.status !== 'COUNTER_OFFERED') {
        throw new ApiError(400, "Cannot create counter offer for this request");
    }

    request.counterOffer = {
        price,
        duration,
        message,
        proposedBy: req.user._id,
        status: 'PENDING'
    };

    request.negotiationHistory.push({
        type: 'COUNTER',
        price,
        duration,
        message,
        by: req.user._id,
        timestamp: new Date()
    });

    request.status = 'COUNTER_OFFERED';
    await request.save();

    await createNotificationHelper(
        request.requester,
        'COUNTER_OFFER_RECEIVED',
        `You received a counter offer for "${request.item.title}"`,
        request._id,
        'Request'
    );

    return res.status(200).json(
        new ApiResponse(200, request, "COUNTER OFFER CREATED SUCCESSFULLY")
    );
});

const respondToCounterOffer = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { accept } = req.body;

    const request = await Request.findById(requestId).populate('item');

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    if (request.requester.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the requester can respond to a counter offer");
    }

    if (request.status !== 'COUNTER_OFFERED' || !request.counterOffer) {
        throw new ApiError(400, "No pending counter offer to respond to");
    }

    request.negotiationHistory.push({
        type: accept ? 'ACCEPT' : 'REJECT',
        price: request.counterOffer.price,
        duration: request.counterOffer.duration,
        by: req.user._id,
        timestamp: new Date()
    });

    if (accept) {
        request.counterOffer.status = 'ACCEPTED';
        request.status = 'ACCEPTED';
        request.proposedPrice = request.counterOffer.price;
        request.proposedDuration = request.counterOffer.duration;

        const transaction = await Transaction.create({
            item: request.item._id,
            owner: request.owner,
            requester: request.requester,
            request: request._id,
            mode: request.item.mode,
            agreedPrice: request.counterOffer.price || request.item.price,
            agreedDuration: request.counterOffer.duration
        });

        await Item.findByIdAndUpdate(request.item._id, { isAvailable: false });

        await createNotificationHelper(
            request.owner,
            'COUNTER_OFFER_ACCEPTED',
            `Your counter offer for "${request.item.title}" was accepted!`,
            transaction._id,
            'Transaction'
        );
    } else {
        request.counterOffer.status = 'REJECTED';
        request.status = 'PENDING';

        await createNotificationHelper(
            request.owner,
            'COUNTER_OFFER_REJECTED',
            `Your counter offer for "${request.item.title}" was rejected`,
            request._id,
            'Request'
        );
    }

    await request.save();

    return res.status(200).json(
        new ApiResponse(200, request, accept ? "COUNTER OFFER ACCEPTED" : "COUNTER OFFER REJECTED")
    );
});

const getItemRequests = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const item = await Item.findById(itemId);

    if (!item) {
        throw new ApiError(404, "Item not found");
    }

    if (item.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the item owner can view requests for this item");
    }

    const filter = { item: itemId };
    if (status) {
        filter.status = status;
    }

    const requests = await Request.find(filter)
        .populate('requester', 'fullName username avatar trustScore')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Request.countDocuments(filter);

    await Item.findByIdAndUpdate(itemId, { $inc: { requestCount: 0 } });

    return res.status(200).json(
        new ApiResponse(200, {
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "ITEM REQUESTS FETCHED SUCCESSFULLY")
    );
});

const proposePickupDetails = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { location, proposedTime, instructions } = req.body;

    const request = await Request.findById(requestId).populate('item');

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    const isOwner = request.owner.toString() === req.user._id.toString();
    const isRequester = request.requester.toString() === req.user._id.toString();

    if (!isOwner && !isRequester) {
        throw new ApiError(403, "You are not authorized to propose pickup details");
    }

    if (request.status !== 'ACCEPTED') {
        throw new ApiError(400, "Request must be accepted before proposing pickup details");
    }

    request.pickupDetails = {
        location,
        proposedTime: new Date(proposedTime),
        instructions
    };
    await request.save();

    const notifyUser = isOwner ? request.requester : request.owner;
    await createNotificationHelper(
        notifyUser,
        'PICKUP_PROPOSED',
        `Pickup details proposed for "${request.item.title}"`,
        request._id,
        'Request'
    );

    return res.status(200).json(
        new ApiResponse(200, request, "PICKUP DETAILS PROPOSED SUCCESSFULLY")
    );
});

const confirmPickupDetails = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await Request.findById(requestId).populate('item');

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    const isOwner = request.owner.toString() === req.user._id.toString();
    const isRequester = request.requester.toString() === req.user._id.toString();

    if (!isOwner && !isRequester) {
        throw new ApiError(403, "You are not authorized to confirm pickup details");
    }

    if (!request.pickupDetails || !request.pickupDetails.proposedTime) {
        throw new ApiError(400, "No pickup details to confirm");
    }

    request.pickupDetails.confirmedTime = request.pickupDetails.proposedTime;
    await request.save();

    const notifyUser = isOwner ? request.requester : request.owner;
    await createNotificationHelper(
        notifyUser,
        'PICKUP_CONFIRMED',
        `Pickup details confirmed for "${request.item.title}" at ${request.pickupDetails.confirmedTime}`,
        request._id,
        'Request'
    );

    return res.status(200).json(
        new ApiResponse(200, request, "PICKUP DETAILS CONFIRMED SUCCESSFULLY")
    );
});

export {
    createRequest,
    getMyRequests,
    getReceivedRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    getActiveRequests,
    instantClaim,
    getClaimQueue,
    confirmPickup,
    createCounterOffer,
    respondToCounterOffer,
    getItemRequests,
    proposePickupDetails,
    confirmPickupDetails
};
