import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { OfferChat } from '../models/offerChat.model.js';
import { WantedItem } from '../models/wantedItem.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { getIO } from '../socket.js';

const getOrCreateChat = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const userId = req.user._id;

    const wantedItem = await WantedItem.findOne({ 'offers._id': offerId });
    if (!wantedItem) {
        throw new ApiError(404, "Offer not found");
    }

    const offer = wantedItem.offers.id(offerId);
    if (!offer) {
        throw new ApiError(404, "Offer not found");
    }

    if (offer.status !== 'ACCEPTED') {
        throw new ApiError(400, "Chat is only available for accepted offers");
    }

    const isRequester = wantedItem.user.toString() === userId.toString();
    const isOfferer = offer.offerer.toString() === userId.toString();

    if (!isRequester && !isOfferer) {
        throw new ApiError(403, "You are not authorized to access this chat");
    }

    let chat = await OfferChat.findOne({ offer: offerId })
        .populate('requester', 'fullName username avatar')
        .populate('offerer', 'fullName username avatar')
        .populate('wantedItem', 'title category');

    if (!chat) {
        chat = await OfferChat.create({
            wantedItem: wantedItem._id,
            offer: offerId,
            requester: wantedItem.user,
            offerer: offer.offerer,
            messages: [{
                sender: userId,
                type: 'SYSTEM',
                content: `Chat started for offer on "${wantedItem.title}"`,
                readBy: [userId]
            }]
        });

        chat.lastMessage = {
            content: `Chat started for offer on "${wantedItem.title}"`,
            sender: userId,
            createdAt: new Date()
        };
        await chat.save();

        chat = await OfferChat.findById(chat._id)
            .populate('requester', 'fullName username avatar')
            .populate('offerer', 'fullName username avatar')
            .populate('wantedItem', 'title category');
    }

    return res.status(200).json(
        new ApiResponse(200, chat, "Chat retrieved successfully")
    );
});

const getChatMessages = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    const chat = await OfferChat.findOne({ offer: offerId });
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    const isParticipant = chat.requester.toString() === userId.toString() ||
                          chat.offerer.toString() === userId.toString();
    if (!isParticipant) {
        throw new ApiError(403, "You are not a participant of this chat");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = chat.messages.length;

    const messages = chat.messages
        .slice()
        .reverse()
        .slice(skip, skip + parseInt(limit))
        .reverse();

    await OfferChat.populate(messages, {
        path: 'sender',
        select: 'fullName username avatar'
    });

    return res.status(200).json(
        new ApiResponse(200, {
            messages,
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
    const { offerId } = req.params;
    const { content, type = 'TEXT' } = req.body;
    const userId = req.user._id;

    const chat = await OfferChat.findOne({ offer: offerId });
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.isActive) {
        throw new ApiError(400, "This chat is no longer active");
    }

    const isParticipant = chat.requester.toString() === userId.toString() ||
                          chat.offerer.toString() === userId.toString();
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
        sender: userId,
        type: imageUrl ? 'IMAGE' : type,
        content: content || (imageUrl ? 'Sent an image' : ''),
        image: imageUrl,
        readBy: [userId]
    };

    chat.messages.push(messageData);
    chat.lastMessage = {
        content: content || (imageUrl ? 'Sent an image' : 'Sent a message'),
        sender: userId,
        createdAt: new Date()
    };
    await chat.save();

    const newMessage = chat.messages[chat.messages.length - 1];
    await OfferChat.populate(newMessage, {
        path: 'sender',
        select: 'fullName username avatar'
    });

    try {
        const io = getIO();
        io.to(`offer-chat:${offerId}`).emit('new-offer-message', newMessage);
    } catch (error) {
        console.error('Socket emit error:', error);
    }

    return res.status(201).json(
        new ApiResponse(201, newMessage, "Message sent successfully")
    );
});

const proposeMeetup = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const { location, date, time, notes } = req.body;
    const userId = req.user._id;

    if (!location || !date || !time) {
        throw new ApiError(400, "Location, date, and time are required for meetup proposal");
    }

    const chat = await OfferChat.findOne({ offer: offerId });
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.isActive) {
        throw new ApiError(400, "This chat is no longer active");
    }

    const isParticipant = chat.requester.toString() === userId.toString() ||
                          chat.offerer.toString() === userId.toString();
    if (!isParticipant) {
        throw new ApiError(403, "You are not a participant of this chat");
    }

    const meetupDate = new Date(date);
    if (meetupDate < new Date()) {
        throw new ApiError(400, "Meetup date must be in the future");
    }

    const messageData = {
        sender: userId,
        type: 'MEETUP_PROPOSAL',
        content: `📅 Meetup Proposal: ${location} on ${meetupDate.toLocaleDateString()} at ${time}`,
        meetup: {
            location,
            date: meetupDate,
            time,
            notes: notes || '',
            status: 'PENDING'
        },
        readBy: [userId]
    };

    chat.messages.push(messageData);
    chat.lastMessage = {
        content: '📅 Proposed a meetup',
        sender: userId,
        createdAt: new Date()
    };
    await chat.save();

    const newMessage = chat.messages[chat.messages.length - 1];
    await OfferChat.populate(newMessage, {
        path: 'sender',
        select: 'fullName username avatar'
    });

    try {
        const io = getIO();
        io.to(`offer-chat:${offerId}`).emit('new-offer-message', newMessage);
    } catch (error) {
        console.error('Socket emit error:', error);
    }

    return res.status(201).json(
        new ApiResponse(201, newMessage, "Meetup proposal sent successfully")
    );
});

const respondToMeetup = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const { messageId, response } = req.body;
    const userId = req.user._id;

    if (!messageId || !response) {
        throw new ApiError(400, "Message ID and response are required");
    }

    if (!['ACCEPTED', 'REJECTED'].includes(response)) {
        throw new ApiError(400, "Response must be ACCEPTED or REJECTED");
    }

    const chat = await OfferChat.findOne({ offer: offerId });
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.isActive) {
        throw new ApiError(400, "This chat is no longer active");
    }

    const isParticipant = chat.requester.toString() === userId.toString() ||
                          chat.offerer.toString() === userId.toString();
    if (!isParticipant) {
        throw new ApiError(403, "You are not a participant of this chat");
    }

    const message = chat.messages.id(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    if (message.type !== 'MEETUP_PROPOSAL') {
        throw new ApiError(400, "This is not a meetup proposal");
    }

    if (message.sender.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot respond to your own proposal");
    }

    if (message.meetup.status !== 'PENDING') {
        throw new ApiError(400, "This proposal has already been responded to");
    }

    message.meetup.status = response;
    message.isEdited = true;

    const systemMessage = {
        sender: userId,
        type: 'SYSTEM',
        content: `Meetup proposal ${response.toLowerCase()}`,
        readBy: [userId]
    };

    chat.messages.push(systemMessage);
    chat.lastMessage = {
        content: `Meetup proposal ${response.toLowerCase()}`,
        sender: userId,
        createdAt: new Date()
    };
    await chat.save();

    try {
        const io = getIO();
        io.to(`offer-chat:${offerId}`).emit('meetup-response', {
            messageId,
            status: response
        });
    } catch (error) {
        console.error('Socket emit error:', error);
    }

    return res.status(200).json(
        new ApiResponse(200, { messageId, status: response }, "Meetup response recorded")
    );
});

const getMyOfferChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const chats = await OfferChat.find({
        $or: [{ requester: userId }, { offerer: userId }],
        isActive: true
    })
        .populate('requester', 'fullName username avatar')
        .populate('offerer', 'fullName username avatar')
        .populate('wantedItem', 'title category referenceImage')
        .populate('lastMessage.sender', 'fullName username')
        .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const chatsWithUnread = chats.map(chat => {
        const unreadCount = chat.messages.filter(
            msg => !msg.readBy.some(id => id.toString() === userId.toString()) &&
                   msg.sender.toString() !== userId.toString()
        ).length;
        return {
            ...chat.toObject(),
            unreadCount
        };
    });

    const total = await OfferChat.countDocuments({
        $or: [{ requester: userId }, { offerer: userId }],
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

export {
    getOrCreateChat,
    getChatMessages,
    sendMessage,
    proposeMeetup,
    respondToMeetup,
    getMyOfferChats
};
