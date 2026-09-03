import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Message } from '../models/message.model.js';
import { Transaction } from '../models/transaction.model.js';
import { createNotificationHelper } from './notification.controller.js';
import { getIO } from '../socket.js';

const sendMessage = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
        throw new ApiError(400, "Message content is required");
    }

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    const isParticipant = 
        transaction.owner.toString() === req.user._id.toString() ||
        transaction.requester.toString() === req.user._id.toString();

    if (!isParticipant) {
        throw new ApiError(403, "You are not authorized to send messages in this transaction");
    }

    const allowedStatuses = ['ACCEPTED', 'AGREEMENT_PROPOSED', 'ACTIVE', 'RETURN_PENDING', 'DISPUTED'];
    if (!allowedStatuses.includes(transaction.status)) {
        throw new ApiError(400, "Messaging is not available for this transaction status");
    }

    const message = await Message.create({
        transaction: transactionId,
        sender: req.user._id,
        content: content.trim()
    });

    const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'fullName username avatar');

    // Emit to socket room for real-time updates
    try {
        const io = getIO();
        io.to(`transaction:${transactionId}`).emit('new-message', populatedMessage);
    } catch (err) {
        console.log('Socket not available for real-time update');
    }

    const recipient = transaction.owner.toString() === req.user._id.toString()
        ? transaction.requester
        : transaction.owner;

    await createNotificationHelper(
        recipient,
        'NEW_MESSAGE',
        `New message from ${req.user.fullName}`,
        transactionId,
        'Transaction'
    );

    return res.status(201).json(
        new ApiResponse(201, populatedMessage, "MESSAGE SENT SUCCESSFULLY")
    );
});

const getMessages = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    const isParticipant = 
        transaction.owner.toString() === req.user._id.toString() ||
        transaction.requester.toString() === req.user._id.toString();

    if (!isParticipant) {
        throw new ApiError(403, "You are not authorized to view messages in this transaction");
    }

    const messages = await Message.find({ transaction: transactionId })
        .populate('sender', 'fullName username avatar')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Message.countDocuments({ transaction: transactionId });

    return res.status(200).json(
        new ApiResponse(200, {
            messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "MESSAGES FETCHED SUCCESSFULLY")
    );
});

export {
    sendMessage,
    getMessages
};
