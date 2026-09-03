import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Item } from '../models/item.model.js';
import { Request } from '../models/request.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const createItem = asyncHandler(async (req, res) => {
    const { title, description, category, mode, price, duration, condition, tags } = req.body;

    if (!title || !category || !mode) {
        throw new ApiError(400, "Title, category, and mode are required");
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

    const item = await Item.create({
        title,
        description,
        category,
        mode,
        price: price || 0,
        duration,
        condition,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        photos,
        owner: req.user._id,
        collegeDomain: req.user.collegeDomain
    });

    return res.status(201).json(
        new ApiResponse(201, item, "ITEM CREATED SUCCESSFULLY")
    );
});

const updateItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { title, description, category, mode, price, duration, condition, tags } = req.body;

    const item = await Item.findById(itemId);

    if (!item) {
        throw new ApiError(404, "Item not found");
    }

    if (item.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this item");
    }

    let photos = item.photos;
    if (req.files && req.files.length > 0) {
        photos = [];
        for (const file of req.files) {
            const uploaded = await uploadOnCloudinary(file.path);
            if (uploaded) {
                photos.push(uploaded.url);
            }
        }
    }

    const updatedItem = await Item.findByIdAndUpdate(
        itemId,
        {
            $set: {
                title: title || item.title,
                description: description || item.description,
                category: category || item.category,
                mode: mode || item.mode,
                price: price !== undefined ? price : item.price,
                duration: duration || item.duration,
                condition: condition || item.condition,
                tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : item.tags,
                photos
            }
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedItem, "ITEM UPDATED SUCCESSFULLY")
    );
});

const deleteItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);

    if (!item) {
        throw new ApiError(404, "Item not found");
    }

    if (item.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this item");
    }

    await Item.findByIdAndDelete(itemId);

    return res.status(200).json(
        new ApiResponse(200, null, "ITEM DELETED SUCCESSFULLY")
    );
});

const markUnavailable = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);

    if (!item) {
        throw new ApiError(404, "Item not found");
    }

    if (item.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this item");
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    return res.status(200).json(
        new ApiResponse(200, item, `ITEM MARKED AS ${item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`)
    );
});

const getMyItems = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find({ owner: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Item.countDocuments({ owner: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, {
            items,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "ITEMS FETCHED SUCCESSFULLY")
    );
});

const getAllItems = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        category, 
        mode, 
        priceMin, 
        priceMax, 
        search 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { isAvailable: true, collegeDomain: req.user.collegeDomain };

    if (category) {
        filter.category = category;
    }

    if (mode) {
        filter.mode = mode;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
        filter.price = {};
        if (priceMin !== undefined) {
            filter.price.$gte = parseFloat(priceMin);
        }
        if (priceMax !== undefined) {
            filter.price.$lte = parseFloat(priceMax);
        }
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }

    const items = await Item.find(filter)
        .populate('owner', 'fullName username avatar trustScore')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Item.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            items,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "ITEMS FETCHED SUCCESSFULLY")
    );
});

const getItemById = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const item = await Item.findById(itemId)
        .populate('owner', 'fullName username avatar campus hostelBlock trustScore');

    if (!item) {
        throw new ApiError(404, "Item not found");
    }

    return res.status(200).json(
        new ApiResponse(200, item, "ITEM FETCHED SUCCESSFULLY")
    );
});

const getRecommendations = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const collegeDomain = req.user.collegeDomain;

    const [userRequests, userItems] = await Promise.all([
        Request.find({ requester: userId }).populate('item', 'category'),
        Item.find({ owner: userId }).select('category')
    ]);

    const categoryFrequency = {};
    userRequests.forEach(r => {
        if (r.item?.category) {
            categoryFrequency[r.item.category] = (categoryFrequency[r.item.category] || 0) + 1;
        }
    });
    userItems.forEach(i => {
        if (i.category) {
            categoryFrequency[i.category] = (categoryFrequency[i.category] || 0) + 1;
        }
    });

    const preferredCategories = Object.keys(categoryFrequency);

    const candidateItems = await Item.find({
        collegeDomain,
        owner: { $ne: userId },
        isAvailable: true
    }).populate('owner', 'fullName username avatar trustScore');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const scoredItems = candidateItems.map(item => {
        let score = 0;

        if (preferredCategories.includes(item.category)) {
            score += 3;
        }

        if (item.owner?.trustScore > 70) {
            score += 1;
        }

        if (item.mode === 'RENT' || item.mode === 'SELL') {
            score += 1;
        }

        if (item.createdAt >= sevenDaysAgo) {
            score += 2;
        }

        return { item, score };
    });

    scoredItems.sort((a, b) => b.score - a.score);

    const recommendations = scoredItems.slice(0, 6).map(s => s.item);

    return res.status(200).json(
        new ApiResponse(200, recommendations, "RECOMMENDATIONS FETCHED SUCCESSFULLY")
    );
});

export {
    createItem,
    updateItem,
    deleteItem,
    markUnavailable,
    getMyItems,
    getAllItems,
    getItemById,
    getRecommendations
};
