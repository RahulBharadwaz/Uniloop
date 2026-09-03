import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Notification } from '../models/notification.model.js';

const createNotificationHelper = async (userId, type, message, relatedId = null, relatedModel = 'Transaction') => {
    try {
        const notificationData = {
            user: userId,
            type,
            title: type.replace(/_/g, ' '),
            message
        };

        // Set the appropriate related field based on model type
        switch (relatedModel) {
            case 'Transaction':
                notificationData.relatedTransaction = relatedId;
                break;
            case 'Request':
                notificationData.relatedRequest = relatedId;
                break;
            case 'LostFoundClaim':
                notificationData.relatedClaim = relatedId;
                break;
            case 'LostFound':
                notificationData.relatedLostFound = relatedId;
                break;
            case 'Offer':
                notificationData.relatedOffer = relatedId;
                break;
            case 'WantedItem':
                notificationData.relatedWantedItem = relatedId;
                break;
        }

        const notification = await Notification.create(notificationData);
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

const getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user._id };
    if (unreadOnly === 'true') {
        filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "NOTIFICATIONS FETCHED SUCCESSFULLY")
    );
});

const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (notification.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this notification");
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json(
        new ApiResponse(200, notification, "NOTIFICATION MARKED AS READ")
    );
});

const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    return res.status(200).json(
        new ApiResponse(200, null, "ALL NOTIFICATIONS MARKED AS READ")
    );
});

const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        user: req.user._id,
        isRead: false
    });

    return res.status(200).json(
        new ApiResponse(200, { count }, "UNREAD COUNT FETCHED SUCCESSFULLY")
    );
});

export {
    createNotificationHelper,
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};
