import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { WantedItem } from '../models/wantedItem.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { createNotificationHelper } from './notification.controller.js';

const createWantedItem = asyncHandler(async (req, res) => {
    const { title, description, category, budget, urgency, quantity, preferredCondition, expiresAt } = req.body;

    if (!title || !description || !category) {
        throw new ApiError(400, "Title, description, and category are required");
    }

    let referenceImage;
    if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path);
        if (uploaded) {
            referenceImage = uploaded.url;
        }
    }

    const wantedItem = await WantedItem.create({
        user: req.user._id,
        collegeDomain: req.user.collegeDomain,
        title,
        description,
        category,
        referenceImage,
        budget: budget ? JSON.parse(budget) : { type: 'ANY' },
        urgency: urgency || 'MEDIUM',
        quantity: quantity || 1,
        preferredCondition: preferredCondition || 'ANY',
        expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    return res.status(201).json(
        new ApiResponse(201, wantedItem, "WANTED ITEM CREATED SUCCESSFULLY")
    );
});

const getWantedItems = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, urgency, budgetType, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { status: 'OPEN', collegeDomain: req.user.collegeDomain };

    if (category) {
        filter.category = category;
    }

    if (urgency) {
        filter.urgency = urgency;
    }

    if (budgetType) {
        filter['budget.type'] = budgetType;
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const wantedItems = await WantedItem.find(filter)
        .populate('user', 'fullName username avatar trustScore')
        .sort({ urgency: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await WantedItem.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            wantedItems,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "WANTED ITEMS FETCHED SUCCESSFULLY")
    );
});

const getMyWantedItems = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user._id };
    if (status) {
        filter.status = status;
    }

    const wantedItems = await WantedItem.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await WantedItem.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            wantedItems,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "MY WANTED ITEMS FETCHED SUCCESSFULLY")
    );
});

const getWantedItemDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const wantedItem = await WantedItem.findById(id)
        .populate('user', 'fullName username avatar campus hostelBlock trustScore')
        .populate('offers.offerer', 'fullName username avatar trustScore')
        .populate('fulfilledBy', 'fullName username avatar');

    if (!wantedItem) {
        throw new ApiError(404, "Wanted item not found");
    }

    await WantedItem.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    return res.status(200).json(
        new ApiResponse(200, wantedItem, "WANTED ITEM FETCHED SUCCESSFULLY")
    );
});

const updateWantedItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, category, budget, urgency, quantity, preferredCondition, expiresAt } = req.body;

    const wantedItem = await WantedItem.findById(id);

    if (!wantedItem) {
        throw new ApiError(404, "Wanted item not found");
    }

    if (wantedItem.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this wanted item");
    }

    if (wantedItem.status !== 'OPEN') {
        throw new ApiError(400, "Cannot update a non-open wanted item");
    }

    let referenceImage = wantedItem.referenceImage;
    if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path);
        if (uploaded) {
            referenceImage = uploaded.url;
        }
    }

    const updatedWantedItem = await WantedItem.findByIdAndUpdate(
        id,
        {
            $set: {
                title: title || wantedItem.title,
                description: description || wantedItem.description,
                category: category || wantedItem.category,
                referenceImage,
                budget: budget ? JSON.parse(budget) : wantedItem.budget,
                urgency: urgency || wantedItem.urgency,
                quantity: quantity || wantedItem.quantity,
                preferredCondition: preferredCondition || wantedItem.preferredCondition,
                expiresAt: expiresAt ? new Date(expiresAt) : wantedItem.expiresAt
            }
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedWantedItem, "WANTED ITEM UPDATED SUCCESSFULLY")
    );
});

const deleteWantedItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const wantedItem = await WantedItem.findById(id);

    if (!wantedItem) {
        throw new ApiError(404, "Wanted item not found");
    }

    if (wantedItem.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this wanted item");
    }

    await WantedItem.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, null, "WANTED ITEM DELETED SUCCESSFULLY")
    );
});

const makeOffer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, offerType, price } = req.body;

    if (!message || !offerType) {
        throw new ApiError(400, "Message and offer type are required");
    }

    const wantedItem = await WantedItem.findById(id);

    if (!wantedItem) {
        throw new ApiError(404, "Wanted item not found");
    }

    if (wantedItem.status !== 'OPEN') {
        throw new ApiError(400, "This wanted item is no longer accepting offers");
    }

    if (wantedItem.user.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot make an offer on your own wanted item");
    }

    const existingOffer = wantedItem.offers.find(
        offer => offer.offerer.toString() === req.user._id.toString() && offer.status === 'PENDING'
    );

    if (existingOffer) {
        throw new ApiError(400, "You already have a pending offer for this item");
    }

    let photos = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const uploaded = await uploadOnCloudinary(file.path);
            if (uploaded) {
                photos.push(uploaded.url);
            }
        }
    }

    const offer = {
        offerer: req.user._id,
        message,
        offerType,
        price: offerType !== 'FREE' ? price : undefined,
        photos,
        status: 'PENDING'
    };

    wantedItem.offers.push(offer);
    await wantedItem.save();

    // Get the newly created offer's ID
    const newOffer = wantedItem.offers[wantedItem.offers.length - 1];

    await createNotificationHelper(
        wantedItem.user,
        'WANTED_OFFER_RECEIVED',
        `New offer received for your wanted item: ${wantedItem.title}`,
        newOffer._id,
        'Offer'
    );

    const populatedWantedItem = await WantedItem.findById(id)
        .populate('offers.offerer', 'fullName username avatar trustScore');

    return res.status(201).json(
        new ApiResponse(201, populatedWantedItem, "OFFER MADE SUCCESSFULLY")
    );
});

const getMyOffers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const matchStage = {
        'offers.offerer': req.user._id
    };

    if (status) {
        matchStage['offers.status'] = status;
    }

    const wantedItems = await WantedItem.find(matchStage)
        .populate('user', 'fullName username avatar')
        .sort({ 'offers.createdAt': -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const myOffers = wantedItems.map(item => {
        const myOffer = item.offers.find(
            offer => offer.offerer.toString() === req.user._id.toString()
        );
        return {
            wantedItem: {
                _id: item._id,
                title: item.title,
                description: item.description,
                category: item.category,
                status: item.status,
                user: item.user
            },
            offer: myOffer
        };
    });

    const total = await WantedItem.countDocuments(matchStage);

    return res.status(200).json(
        new ApiResponse(200, {
            offers: myOffers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "MY OFFERS FETCHED SUCCESSFULLY")
    );
});

const getOffersReceived = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const wantedItems = await WantedItem.find({
        user: req.user._id,
        'offers.0': { $exists: true }
    })
        .populate('offers.offerer', 'fullName username avatar trustScore')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const offersReceived = wantedItems.map(item => ({
        wantedItem: {
            _id: item._id,
            title: item.title,
            status: item.status
        },
        offers: item.offers
    }));

    const total = await WantedItem.countDocuments({
        user: req.user._id,
        'offers.0': { $exists: true }
    });

    return res.status(200).json(
        new ApiResponse(200, {
            offersReceived,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "OFFERS RECEIVED FETCHED SUCCESSFULLY")
    );
});

const acceptOffer = asyncHandler(async (req, res) => {
    const { id, offerId } = req.params;

    const wantedItem = await WantedItem.findById(id);

    if (!wantedItem) {
        throw new ApiError(404, "Wanted item not found");
    }

    if (wantedItem.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to accept offers for this item");
    }

    if (wantedItem.status !== 'OPEN') {
        throw new ApiError(400, "This wanted item is no longer open");
    }

    const offer = wantedItem.offers.id(offerId);

    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    if (offer.status !== 'PENDING') {
        throw new ApiError(400, "This offer is no longer pending");
    }

    offer.status = 'ACCEPTED';
    offer.chatEnabled = true;
    wantedItem.status = 'FULFILLED';
    wantedItem.acceptedOffer = offerId;
    wantedItem.fulfilledBy = offer.offerer;

    wantedItem.offers.forEach(o => {
        if (o._id.toString() !== offerId && o.status === 'PENDING') {
            o.status = 'REJECTED';
        }
    });

    await wantedItem.save();

    await createNotificationHelper(
        offer.offerer,
        'WANTED_OFFER_ACCEPTED',
        `Your offer for "${wantedItem.title}" has been accepted!`,
        offerId,
        'Offer'
    );

    const populatedWantedItem = await WantedItem.findById(id)
        .populate('offers.offerer', 'fullName username avatar trustScore')
        .populate('fulfilledBy', 'fullName username avatar');

    return res.status(200).json(
        new ApiResponse(200, populatedWantedItem, "OFFER ACCEPTED SUCCESSFULLY")
    );
});

const rejectOffer = asyncHandler(async (req, res) => {
    const { id, offerId } = req.params;

    const wantedItem = await WantedItem.findById(id);

    if (!wantedItem) {
        throw new ApiError(404, "Wanted item not found");
    }

    if (wantedItem.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to reject offers for this item");
    }

    const offer = wantedItem.offers.id(offerId);

    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    if (offer.status !== 'PENDING') {
        throw new ApiError(400, "This offer is no longer pending");
    }

    offer.status = 'REJECTED';
    await wantedItem.save();

    await createNotificationHelper(
        offer.offerer,
        'WANTED_OFFER_REJECTED',
        `Your offer for "${wantedItem.title}" has been rejected`,
        offerId,
        'Offer'
    );

    return res.status(200).json(
        new ApiResponse(200, wantedItem, "OFFER REJECTED SUCCESSFULLY")
    );
});

const cancelOffer = asyncHandler(async (req, res) => {
    const { id, offerId } = req.params;

    const wantedItem = await WantedItem.findById(id);

    if (!wantedItem) {
        throw new ApiError(404, "Wanted item not found");
    }

    const offer = wantedItem.offers.id(offerId);

    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    if (offer.offerer.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to cancel this offer");
    }

    if (offer.status !== 'PENDING') {
        throw new ApiError(400, "Only pending offers can be cancelled");
    }

    offer.status = 'CANCELLED';
    await wantedItem.save();

    return res.status(200).json(
        new ApiResponse(200, wantedItem, "OFFER CANCELLED SUCCESSFULLY")
    );
});

const markFulfilled = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const wantedItem = await WantedItem.findById(id);

    if (!wantedItem) {
        throw new ApiError(404, "Wanted item not found");
    }

    if (wantedItem.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to mark this item as fulfilled");
    }

    if (wantedItem.status === 'FULFILLED') {
        throw new ApiError(400, "This wanted item is already fulfilled");
    }

    wantedItem.status = 'FULFILLED';
    await wantedItem.save();

    return res.status(200).json(
        new ApiResponse(200, wantedItem, "WANTED ITEM MARKED AS FULFILLED")
    );
});

const getOfferById = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const userId = req.user._id;

    const wantedItem = await WantedItem.findOne({ 'offers._id': offerId })
        .populate('user', 'fullName username avatar trustScore')
        .populate('offers.offerer', 'fullName username avatar trustScore');

    if (!wantedItem) {
        throw new ApiError(404, "Offer not found");
    }

    const offer = wantedItem.offers.id(offerId);
    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    const isRequester = wantedItem.user._id.toString() === userId.toString();
    const isOfferer = offer.offerer._id.toString() === userId.toString();

    if (!isRequester && !isOfferer) {
        throw new ApiError(403, "You are not authorized to view this offer");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            ...offer.toObject(),
            wantedItem: {
                _id: wantedItem._id,
                title: wantedItem.title,
                description: wantedItem.description,
                category: wantedItem.category,
                referenceImage: wantedItem.referenceImage,
                user: wantedItem.user
            }
        }, "OFFER FETCHED SUCCESSFULLY")
    );
});

export {
    createWantedItem,
    getWantedItems,
    getMyWantedItems,
    getWantedItemDetail,
    updateWantedItem,
    deleteWantedItem,
    makeOffer,
    getMyOffers,
    getOffersReceived,
    acceptOffer,
    rejectOffer,
    cancelOffer,
    markFulfilled,
    getOfferById
};
