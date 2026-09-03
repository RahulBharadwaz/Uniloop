import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Transaction } from '../models/transaction.model.js';
import { Item } from '../models/item.model.js';
import { updateTrustScoreHelper } from './trustScore.controller.js';
import { createNotificationHelper } from './notification.controller.js';

const VALID_STATUS_TRANSITIONS = {
    'PENDING': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
    'ACCEPTED': ['AGREEMENT_PROPOSED', 'CANCELLED', 'DISPUTED'],
    'AGREEMENT_PROPOSED': ['ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
    'ACTIVE': ['RETURN_PENDING', 'DISPUTED'],
    'RETURN_PENDING': ['COMPLETED', 'DISPUTED'],
    'COMPLETED': [],
    'CANCELLED': [],
    'DISPUTED': ['COMPLETED', 'CANCELLED'],
    'REJECTED': []
};

const getTransaction = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId)
        .populate('item', 'title description photos mode price')
        .populate('owner', 'fullName username avatar phone campus hostelBlock')
        .populate('requester', 'fullName username avatar phone campus hostelBlock')
        .populate('request');

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    const isParticipant = 
        transaction.owner._id.toString() === req.user._id.toString() ||
        transaction.requester._id.toString() === req.user._id.toString();

    if (!isParticipant) {
        throw new ApiError(403, "You are not authorized to view this transaction");
    }

    return res.status(200).json(
        new ApiResponse(200, transaction, "TRANSACTION FETCHED SUCCESSFULLY")
    );
});

const getMyTransactions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};

    if (role === 'owner') {
        filter.owner = req.user._id;
    } else if (role === 'requester') {
        filter.requester = req.user._id;
    } else {
        filter.$or = [
            { owner: req.user._id },
            { requester: req.user._id }
        ];
    }

    if (status) {
        filter.status = status;
    }

    const transactions = await Transaction.find(filter)
        .populate('item', 'title photos mode price')
        .populate('owner', 'fullName username avatar')
        .populate('requester', 'fullName username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "TRANSACTIONS FETCHED SUCCESSFULLY")
    );
});

const updateTransactionStatus = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    const { status } = req.body;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    const isParticipant = 
        transaction.owner.toString() === req.user._id.toString() ||
        transaction.requester.toString() === req.user._id.toString();

    if (!isParticipant) {
        throw new ApiError(403, "You are not authorized to update this transaction");
    }

    const validTransitions = VALID_STATUS_TRANSITIONS[transaction.status];
    if (!validTransitions || !validTransitions.includes(status)) {
        throw new ApiError(400, `Invalid status transition from ${transaction.status} to ${status}`);
    }

    transaction.status = status;
    await transaction.save();

    return res.status(200).json(
        new ApiResponse(200, transaction, "TRANSACTION STATUS UPDATED SUCCESSFULLY")
    );
});

const proposeAgreement = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    const { agreedPrice, agreedDuration, terms, startDate, endDate } = req.body;

    const transaction = await Transaction.findById(transactionId).populate('item');

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    if (transaction.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the owner can propose agreement terms");
    }

    if (transaction.status !== 'ACCEPTED') {
        throw new ApiError(400, "Agreement can only be proposed after request is accepted");
    }

    if (transaction.item.mode === 'GIVE') {
        transaction.agreedPrice = 0;
    } else if (agreedPrice !== undefined) {
        transaction.agreedPrice = Number(agreedPrice) || 0;
    }
    if (agreedDuration !== undefined && !isNaN(Number(agreedDuration))) {
        transaction.agreedDuration = Number(agreedDuration);
    }
    if (terms !== undefined) {
        transaction.terms = terms;
    }
    if (startDate) {
        transaction.startDate = new Date(startDate);
    }
    if (endDate) {
        transaction.endDate = new Date(endDate);
    }
    transaction.status = 'AGREEMENT_PROPOSED';
    await transaction.save();

    await createNotificationHelper(
        transaction.requester,
        'AGREEMENT_PROPOSED',
        `Agreement proposed for "${transaction.item.title}". Please review and confirm.`,
        transaction._id,
        'Transaction'
    );

    return res.status(200).json(
        new ApiResponse(200, transaction, "AGREEMENT PROPOSED SUCCESSFULLY")
    );
});

const confirmAgreement = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId).populate('item');

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    if (transaction.requester.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the requester can confirm the agreement");
    }

    if (transaction.status !== 'AGREEMENT_PROPOSED') {
        throw new ApiError(400, "No agreement to confirm");
    }

    if (transaction.item.mode === 'RENT') {
        transaction.status = 'ACTIVE';
        transaction.startDate = transaction.startDate || new Date();
        await transaction.save();

        await createNotificationHelper(
            transaction.owner,
            'AGREEMENT_CONFIRMED',
            `Agreement confirmed for "${transaction.item.title}". Transaction is now active.`,
            transaction._id,
            'Transaction'
        );
    } else {
        transaction.status = 'COMPLETED';
        transaction.endDate = new Date();
        await transaction.save();

        await Item.findByIdAndUpdate(transaction.item._id, { isAvailable: false });
        await updateTrustScoreHelper(transaction.requester, 'COMPLETED');
        await updateTrustScoreHelper(transaction.owner, 'COMPLETED');

        await createNotificationHelper(
            transaction.owner,
            'TRANSACTION_COMPLETED',
            `"${transaction.item.title}" has been ${transaction.item.mode === 'SELL' ? 'sold' : 'given away'} successfully!`,
            transaction._id,
            'Transaction'
        );
    }

    return res.status(200).json(
        new ApiResponse(200, transaction, "AGREEMENT CONFIRMED")
    );
});

const markReturnPending = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId).populate('item');

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    if (transaction.requester.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the borrower can mark as return pending");
    }

    if (transaction.item.mode !== 'RENT') {
        throw new ApiError(400, "Return flow is only for rental transactions");
    }

    if (transaction.status !== 'ACTIVE') {
        throw new ApiError(400, "Transaction must be active to mark as return pending");
    }

    transaction.status = 'RETURN_PENDING';
    await transaction.save();

    await createNotificationHelper(
        transaction.owner,
        'RETURN_PENDING',
        `Item "${transaction.item.title}" is ready to be returned. Please confirm return.`,
        transaction._id,
        'Transaction'
    );

    return res.status(200).json(
        new ApiResponse(200, transaction, "MARKED AS RETURN PENDING")
    );
});

const confirmReturn = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId).populate('item');

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    if (transaction.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the owner can confirm return");
    }

    if (transaction.item.mode !== 'RENT') {
        throw new ApiError(400, "Return flow is only for rental transactions");
    }

    if (transaction.status !== 'RETURN_PENDING') {
        throw new ApiError(400, "Return must be pending to confirm");
    }

    transaction.status = 'COMPLETED';
    transaction.endDate = new Date();
    transaction.actualReturnDate = new Date();
    await transaction.save();

    await Item.findByIdAndUpdate(transaction.item._id, { isAvailable: true });

    let trustAction = 'COMPLETED';
    if (transaction.endDate && transaction.agreedDuration) {
        const expectedEnd = new Date(transaction.startDate);
        expectedEnd.setDate(expectedEnd.getDate() + parseInt(transaction.agreedDuration));
        const actualEnd = new Date();
        const daysLate = Math.floor((actualEnd - expectedEnd) / (1000 * 60 * 60 * 24));

        if (daysLate <= 0) {
            trustAction = 'ON_TIME_RETURN';
        } else if (daysLate <= 3) {
            trustAction = 'LATE_RETURN_MINOR';
        } else {
            trustAction = 'LATE_RETURN_MAJOR';
        }
    }

    await updateTrustScoreHelper(transaction.requester, trustAction);
    await updateTrustScoreHelper(transaction.owner, 'COMPLETED');

    await createNotificationHelper(
        transaction.requester,
        'TRANSACTION_COMPLETED',
        `Transaction for "${transaction.item.title}" has been completed. Thank you!`,
        transaction._id,
        'Transaction'
    );

    return res.status(200).json(
        new ApiResponse(200, transaction, "RETURN CONFIRMED - TRANSACTION COMPLETED")
    );
});

const raiseDispute = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    const { reason } = req.body;

    const transaction = await Transaction.findById(transactionId).populate('item');

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    const isParticipant = 
        transaction.owner.toString() === req.user._id.toString() ||
        transaction.requester.toString() === req.user._id.toString();

    if (!isParticipant) {
        throw new ApiError(403, "Only transaction participants can raise a dispute");
    }

    if (['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(transaction.status)) {
        throw new ApiError(400, "Cannot raise dispute on this transaction");
    }

    transaction.status = 'DISPUTED';
    transaction.disputeReason = reason;
    transaction.disputeRaisedBy = req.user._id;
    transaction.disputeDate = new Date();
    await transaction.save();

    const otherParty = transaction.owner.toString() === req.user._id.toString() 
        ? transaction.requester 
        : transaction.owner;

    await createNotificationHelper(
        otherParty,
        'DISPUTE_RAISED',
        `A dispute has been raised for "${transaction.item.title}"`,
        transaction._id,
        'Transaction'
    );

    await updateTrustScoreHelper(req.user._id, 'DISPUTE');

    return res.status(200).json(
        new ApiResponse(200, transaction, "DISPUTE RAISED SUCCESSFULLY")
    );
});

export {
    getTransaction,
    getMyTransactions,
    updateTransactionStatus,
    proposeAgreement,
    confirmAgreement,
    markReturnPending,
    confirmReturn,
    raiseDispute
};
