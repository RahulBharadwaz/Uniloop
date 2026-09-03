import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ClaimChat, ClaimMessage } from '../models/claimChat.model.js';
import { LostFound } from '../models/lostFound.model.js';
import { LostFoundClaim } from '../models/lostFoundClaim.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { getIO } from '../socket.js';

const getChatForClaim = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const userId = req.user._id;

    // Find the claim (LostFoundClaim, not LostFound post)
    const claim = await LostFoundClaim.findById(claimId)
        .populate('post', 'title type photo location')
        .populate('claimant', 'fullName username avatar')
        .populate('postOwner', 'fullName username avatar');
    
    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    // Check if user is authorized (either claimant or post owner)
    const isClaimant = claim.claimant._id.toString() === userId.toString();
    const isPostOwner = claim.postOwner._id.toString() === userId.toString();

    if (!isClaimant && !isPostOwner) {
        throw new ApiError(403, "You are not authorized to access this chat");
    }

    // Check if claim is verified (chat enabled)
    if (claim.status !== 'VERIFIED' && claim.status !== 'RESOLVED') {
        throw new ApiError(400, "Chat is only available for verified claims");
    }

    let chat = await ClaimChat.findOne({
        claim: claimId
    }).populate('participants', 'fullName username avatar');

    if (!chat) {
        // Create new chat
        chat = await ClaimChat.create({
            claim: claimId,
            participants: [claim.postOwner._id, claim.claimant._id],
            unreadCount: new Map([
                [claim.postOwner._id.toString(), 0], 
                [claim.claimant._id.toString(), 0]
            ])
        });

        const systemMessage = await ClaimMessage.create({
            chat: chat._id,
            sender: userId,
            content: `Chat started for claim on "${claim.post.title}"`,
            messageType: 'SYSTEM'
        });

        chat.lastMessage = {
            content: systemMessage.content,
            sender: userId,
            timestamp: new Date()
        };
        await chat.save();

        chat = await ClaimChat.findById(chat._id)
            .populate('participants', 'fullName username avatar');
    }

    // Attach claim info to response
    const response = {
        ...chat.toObject(),
        claimInfo: {
            _id: claim._id,
            post: claim.post,
            status: claim.status
        }
    };

    return res.status(200).json(
        new ApiResponse(200, response, "Chat retrieved successfully")
    );
});

const getMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    const chat = await ClaimChat.findById(chatId);
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    const isParticipant = chat.participants.some(
        p => p.toString() === userId.toString()
    );
    if (!isParticipant) {
        throw new ApiError(403, "You are not a participant of this chat");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await ClaimMessage.find({ chat: chatId })
        .populate('sender', 'fullName username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await ClaimMessage.countDocuments({ chat: chatId });

    return res.status(200).json(
        new ApiResponse(200, {
            messages: messages.reverse(),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "Messages fetched successfully")
    );
});

const sendMessage = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { content, messageType = 'TEXT', metadata } = req.body;
    const userId = req.user._id;

    const chat = await ClaimChat.findById(chatId);
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.isActive) {
        throw new ApiError(400, "This chat is no longer active");
    }

    const isParticipant = chat.participants.some(
        p => p.toString() === userId.toString()
    );
    if (!isParticipant) {
        throw new ApiError(403, "You are not a participant of this chat");
    }

    let imageUrl = null;
    if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path);
        if (uploaded) {
            imageUrl = uploaded.url;
        }
    }

    const messageData = {
        chat: chatId,
        sender: userId,
        content,
        messageType: imageUrl ? 'IMAGE' : messageType,
        metadata: imageUrl ? { ...metadata, imageUrl } : metadata,
        readBy: [{ user: userId, readAt: new Date() }]
    };

    const message = await ClaimMessage.create(messageData);

    chat.lastMessage = {
        content: content || (imageUrl ? 'Sent an image' : 'Sent a message'),
        sender: userId,
        timestamp: new Date()
    };

    chat.participants.forEach(participant => {
        if (participant.toString() !== userId.toString()) {
            const currentCount = chat.unreadCount.get(participant.toString()) || 0;
            chat.unreadCount.set(participant.toString(), currentCount + 1);
        }
    });
    await chat.save();

    const populatedMessage = await ClaimMessage.findById(message._id)
        .populate('sender', 'fullName username avatar');

    try {
        const io = getIO();
        io.to(`claim-chat:${chatId}`).emit('new-claim-message', populatedMessage);
    } catch (error) {
        console.error('Socket emit error:', error);
    }

    return res.status(201).json(
        new ApiResponse(201, populatedMessage, "Message sent successfully")
    );
});

const markAsRead = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await ClaimChat.findById(chatId);
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    const isParticipant = chat.participants.some(
        p => p.toString() === userId.toString()
    );
    if (!isParticipant) {
        throw new ApiError(403, "You are not a participant of this chat");
    }

    await ClaimMessage.updateMany(
        {
            chat: chatId,
            'readBy.user': { $ne: userId }
        },
        {
            $push: {
                readBy: { user: userId, readAt: new Date() }
            }
        }
    );

    chat.unreadCount.set(userId.toString(), 0);
    await chat.save();

    try {
        const io = getIO();
        io.to(`claim-chat:${chatId}`).emit('claim-messages-read', {
            chatId,
            userId: userId.toString()
        });
    } catch (error) {
        console.error('Socket emit error:', error);
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Messages marked as read")
    );
});

const getMyChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const chats = await ClaimChat.find({
        participants: userId,
        isActive: true
    })
        .populate('participants', 'fullName username avatar')
        .populate({
            path: 'claim',
            select: 'post status claimant postOwner',
            populate: {
                path: 'post',
                select: 'title type photo location'
            }
        })
        .populate('lastMessage.sender', 'fullName username')
        .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const chatsWithUnread = chats.map(chat => ({
        ...chat.toObject(),
        unreadCount: chat.unreadCount.get(userId.toString()) || 0
    }));

    const total = await ClaimChat.countDocuments({
        participants: userId,
        isActive: true
    });

    return res.status(200).json(
        new ApiResponse(200, {
            chats: chatsWithUnread,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "Chats fetched successfully")
    );
});

const sendLocationMessage = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { name, lat, lng } = req.body;
    const userId = req.user._id;

    if (!name || lat === undefined || lng === undefined) {
        throw new ApiError(400, "Location name and coordinates are required");
    }

    const chat = await ClaimChat.findById(chatId);
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.isActive) {
        throw new ApiError(400, "This chat is no longer active");
    }

    const isParticipant = chat.participants.some(
        p => p.toString() === userId.toString()
    );
    if (!isParticipant) {
        throw new ApiError(403, "You are not a participant of this chat");
    }

    const message = await ClaimMessage.create({
        chat: chatId,
        sender: userId,
        content: `📍 Location: ${name}`,
        messageType: 'LOCATION',
        metadata: {
            location: {
                name,
                coordinates: { lat, lng }
            }
        },
        readBy: [{ user: userId, readAt: new Date() }]
    });

    chat.lastMessage = {
        content: `📍 Shared a location`,
        sender: userId,
        timestamp: new Date()
    };

    chat.participants.forEach(participant => {
        if (participant.toString() !== userId.toString()) {
            const currentCount = chat.unreadCount.get(participant.toString()) || 0;
            chat.unreadCount.set(participant.toString(), currentCount + 1);
        }
    });
    await chat.save();

    const populatedMessage = await ClaimMessage.findById(message._id)
        .populate('sender', 'fullName username avatar');

    try {
        const io = getIO();
        io.to(`claim-chat:${chatId}`).emit('new-claim-message', populatedMessage);
    } catch (error) {
        console.error('Socket emit error:', error);
    }

    return res.status(201).json(
        new ApiResponse(201, populatedMessage, "Location shared successfully")
    );
});

const proposeMeetupInChat = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { location, time } = req.body;
    const userId = req.user._id;

    if (!location || !time) {
        throw new ApiError(400, "Location and time are required for meetup proposal");
    }

    const chat = await ClaimChat.findById(chatId);
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.isActive) {
        throw new ApiError(400, "This chat is no longer active");
    }

    const isParticipant = chat.participants.some(
        p => p.toString() === userId.toString()
    );
    if (!isParticipant) {
        throw new ApiError(403, "You are not a participant of this chat");
    }

    const meetupTime = new Date(time);
    if (meetupTime < new Date()) {
        throw new ApiError(400, "Meetup time must be in the future");
    }

    const message = await ClaimMessage.create({
        chat: chatId,
        sender: userId,
        content: `📅 Meetup Proposal: ${location} at ${meetupTime.toLocaleString()}`,
        messageType: 'MEETUP_PROPOSAL',
        metadata: {
            meetup: {
                location,
                time: meetupTime
            }
        },
        readBy: [{ user: userId, readAt: new Date() }]
    });

    chat.lastMessage = {
        content: `📅 Proposed a meetup`,
        sender: userId,
        timestamp: new Date()
    };

    chat.participants.forEach(participant => {
        if (participant.toString() !== userId.toString()) {
            const currentCount = chat.unreadCount.get(participant.toString()) || 0;
            chat.unreadCount.set(participant.toString(), currentCount + 1);
        }
    });
    await chat.save();

    const populatedMessage = await ClaimMessage.findById(message._id)
        .populate('sender', 'fullName username avatar');

    try {
        const io = getIO();
        io.to(`claim-chat:${chatId}`).emit('new-claim-message', populatedMessage);
    } catch (error) {
        console.error('Socket emit error:', error);
    }

    return res.status(201).json(
        new ApiResponse(201, populatedMessage, "Meetup proposal sent successfully")
    );
});

export {
    getChatForClaim,
    getMessages,
    sendMessage,
    markAsRead,
    getMyChats,
    sendLocationMessage,
    proposeMeetupInChat
};
