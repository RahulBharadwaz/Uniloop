import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { LostFound } from '../models/lostFound.model.js';
import { LostFoundClaim } from '../models/lostFoundClaim.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { createNotificationHelper } from './notification.controller.js';

const createPost = asyncHandler(async (req, res) => {
    const { 
        title, description, type, location, category, 
        verificationQuestions, reward, lastSeenDate, 
        contactPreference, urgency 
    } = req.body;

    if (!title || !type || !category) {
        throw new ApiError(400, "Title, type and category are required");
    }

    if (!location) {
        throw new ApiError(400, "Location is required");
    }

    if (!description) {
        throw new ApiError(400, "Description is required");
    }

    const typeUpper = type.toUpperCase();
    if (!['LOST', 'FOUND'].includes(typeUpper)) {
        throw new ApiError(400, "Type must be either LOST or FOUND");
    }

    let photo = null;
    if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path);
        if (uploaded) {
            photo = uploaded.url;
        }
    }

    // Parse JSON fields if they're strings
    let parsedVerificationQuestions = [];
    if (verificationQuestions) {
        try {
            parsedVerificationQuestions = typeof verificationQuestions === 'string' 
                ? JSON.parse(verificationQuestions) 
                : verificationQuestions;
        } catch (e) {
            parsedVerificationQuestions = [];
        }
    }

    let parsedReward = { offered: false };
    if (reward) {
        try {
            parsedReward = typeof reward === 'string' ? JSON.parse(reward) : reward;
        } catch (e) {
            parsedReward = { offered: false };
        }
    }

    const post = await LostFound.create({
        title,
        description,
        type: typeUpper,
        location,
        category,
        photo,
        user: req.user._id,
        collegeDomain: req.user.collegeDomain,
        verificationQuestions: parsedVerificationQuestions,
        reward: parsedReward,
        lastSeenDate: lastSeenDate || new Date(),
        contactPreference: (contactPreference || 'CHAT').toUpperCase(),
        urgency: (urgency || 'MEDIUM').toUpperCase()
    });

    const populatedPost = await LostFound.findById(post._id)
        .populate('user', 'fullName username avatar campus');

    return res.status(201).json(
        new ApiResponse(201, populatedPost, "Post created successfully")
    );
});

const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { 
        title, description, location, category, 
        verificationQuestions, reward, lastSeenDate, 
        contactPreference, urgency 
    } = req.body;

    const post = await LostFound.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }

    if (post.isResolved) {
        throw new ApiError(400, "Cannot edit a resolved post");
    }

    if (title) post.title = title;
    if (description) post.description = description;
    if (location) post.location = location;
    if (category) post.category = category;
    if (urgency) post.urgency = urgency.toUpperCase();
    if (contactPreference) post.contactPreference = contactPreference.toUpperCase();
    if (lastSeenDate) post.lastSeenDate = lastSeenDate;

    if (verificationQuestions) {
        try {
            post.verificationQuestions = typeof verificationQuestions === 'string' 
                ? JSON.parse(verificationQuestions) 
                : verificationQuestions;
        } catch (e) {}
    }

    if (reward) {
        try {
            post.reward = typeof reward === 'string' ? JSON.parse(reward) : reward;
        } catch (e) {}
    }

    if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path);
        if (uploaded) {
            post.photo = uploaded.url;
        }
    }

    await post.save();

    const updatedPost = await LostFound.findById(post._id)
        .populate('user', 'fullName username avatar campus');

    return res.status(200).json(
        new ApiResponse(200, updatedPost, "Post updated successfully")
    );
});

const getPosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, type, status, category, urgency } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { collegeDomain: req.user.collegeDomain };

    if (type && ['LOST', 'FOUND'].includes(type)) {
        filter.type = type;
    }

    if (status) {
        filter.status = status;
    }

    if (category) {
        filter.category = category;
    }

    if (urgency) {
        filter.urgency = urgency;
    }

    const posts = await LostFound.find(filter)
        .populate('user', 'fullName username avatar campus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await LostFound.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "POSTS FETCHED SUCCESSFULLY")
    );
});

const getMyPosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await LostFound.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await LostFound.countDocuments({ user: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, {
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "YOUR POSTS FETCHED SUCCESSFULLY")
    );
});

const getPostDetail = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await LostFound.findById(postId)
        .populate('user', 'fullName username avatar campus')
        .populate('resolvedWith', 'fullName username avatar');

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const isOwner = post.user._id.toString() === req.user._id.toString();
    
    const postData = post.toObject();
    if (!isOwner) {
        postData.verificationQuestions = postData.verificationQuestions.map(q => ({
            question: q.question,
            _id: q._id
        }));
    }

    return res.status(200).json(
        new ApiResponse(200, { post: postData, isOwner }, "POST FETCHED SUCCESSFULLY")
    );
});

const markResolved = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await LostFound.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }

    post.isResolved = true;
    post.status = 'RESOLVED';
    post.resolvedAt = new Date();
    await post.save();

    return res.status(200).json(
        new ApiResponse(200, post, "POST MARKED AS RESOLVED")
    );
});

const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await LostFound.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this post");
    }

    await LostFoundClaim.deleteMany({ post: postId });
    await LostFound.findByIdAndDelete(postId);

    return res.status(200).json(
        new ApiResponse(200, null, "POST DELETED SUCCESSFULLY")
    );
});

const createClaim = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { message, proofPhotos, locationFound, dateFound } = req.body;

    if (!message) {
        throw new ApiError(400, "Message is required");
    }

    const post = await LostFound.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.user.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot claim your own post");
    }

    if (post.status === 'RESOLVED' || post.status === 'EXPIRED') {
        throw new ApiError(400, "This post is no longer accepting claims");
    }

    const existingClaim = await LostFoundClaim.findOne({
        post: postId,
        claimant: req.user._id
    });

    if (existingClaim) {
        throw new ApiError(400, "You have already submitted a claim for this post");
    }

    const claimType = post.type === 'LOST' ? 'I_FOUND_IT' : 'ITS_MINE';

    const claim = await LostFoundClaim.create({
        post: postId,
        claimant: req.user._id,
        postOwner: post.user,
        claimType,
        message,
        proofPhotos: proofPhotos || [],
        locationFound,
        dateFound,
        timeline: [{
            action: 'CLAIM_SUBMITTED',
            by: req.user._id,
            details: `Claim submitted: ${claimType}`
        }]
    });

    post.claimsCount += 1;
    if (post.status === 'OPEN') {
        post.status = 'CLAIMED';
    }
    await post.save();

    await createNotificationHelper(
        post.user,
        'LOST_FOUND_CLAIM',
        `Someone has submitted a claim for your ${post.type.toLowerCase()} item: ${post.title}`,
        claim._id,
        'LostFoundClaim'
    );

    const populatedClaim = await LostFoundClaim.findById(claim._id)
        .populate('claimant', 'fullName username avatar')
        .populate('post', 'title type');

    return res.status(201).json(
        new ApiResponse(201, populatedClaim, "CLAIM SUBMITTED SUCCESSFULLY")
    );
});

const getPostClaims = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const post = await LostFound.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only post owner can view claims");
    }

    const filter = { post: postId };
    if (status) {
        filter.status = status;
    }

    const claims = await LostFoundClaim.find(filter)
        .populate('claimant', 'fullName username avatar campus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await LostFoundClaim.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            claims,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "CLAIMS FETCHED SUCCESSFULLY")
    );
});

const getMyClaims = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { claimant: req.user._id };
    if (status) {
        filter.status = status;
    }

    const claims = await LostFoundClaim.find(filter)
        .populate('post', 'title type photo location category status verificationQuestions user')
        .populate('postOwner', 'fullName username avatar')
        .populate({
            path: 'post',
            populate: {
                path: 'user',
                select: 'fullName username avatar'
            }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await LostFoundClaim.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            claims,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "YOUR CLAIMS FETCHED SUCCESSFULLY")
    );
});

const getReceivedClaims = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { postOwner: req.user._id };
    if (status) {
        filter.status = status;
    }

    const claims = await LostFoundClaim.find(filter)
        .populate('post', 'title type photo location category status verificationQuestions')
        .populate('claimant', 'fullName username avatar campus trustScore')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await LostFoundClaim.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            claims,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "RECEIVED CLAIMS FETCHED SUCCESSFULLY")
    );
});

const startVerification = asyncHandler(async (req, res) => {
    const { claimId } = req.params;

    const claim = await LostFoundClaim.findById(claimId)
        .populate('post');

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    if (claim.postOwner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only post owner can start verification");
    }

    if (claim.status !== 'PENDING') {
        throw new ApiError(400, "Claim is not in pending status");
    }

    claim.status = 'VERIFICATION';
    claim.timeline.push({
        action: 'VERIFICATION_STARTED',
        by: req.user._id,
        details: 'Verification process started'
    });
    await claim.save();

    await createNotificationHelper(
        claim.claimant,
        'LOST_FOUND_VERIFICATION',
        `Your claim has been moved to verification. Please answer the questions.`,
        claim._id,
        'LostFoundClaim'
    );

    const questions = claim.post.verificationQuestions.map(q => ({
        _id: q._id,
        question: q.question
    }));

    return res.status(200).json(
        new ApiResponse(200, { claim, questions }, "VERIFICATION STARTED")
    );
});

const submitVerification = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
        throw new ApiError(400, "Answers are required");
    }

    const claim = await LostFoundClaim.findById(claimId)
        .populate('post');

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    if (claim.claimant.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only claimant can submit verification");
    }

    if (claim.status !== 'VERIFICATION') {
        throw new ApiError(400, "Claim is not in verification status");
    }

    claim.verificationAnswers = answers;

    let correctAnswers = 0;
    const postQuestions = claim.post.verificationQuestions;
    for (const answer of answers) {
        const question = postQuestions.find(q => q._id.toString() === answer.questionId);
        if (question && question.answer.toLowerCase().trim() === answer.answer.toLowerCase().trim()) {
            correctAnswers++;
        }
    }
    claim.verificationScore = postQuestions.length > 0 
        ? Math.round((correctAnswers / postQuestions.length) * 100) 
        : 0;

    claim.timeline.push({
        action: 'VERIFICATION_SUBMITTED',
        by: req.user._id,
        details: `Verification answers submitted. Score: ${claim.verificationScore}%`
    });
    await claim.save();

    await createNotificationHelper(
        claim.postOwner,
        'LOST_FOUND_VERIFICATION_SUBMITTED',
        `Claimant has submitted verification answers with ${claim.verificationScore}% score`,
        claim._id,
        'LostFoundClaim'
    );

    return res.status(200).json(
        new ApiResponse(200, claim, "VERIFICATION SUBMITTED SUCCESSFULLY")
    );
});

const verifyClaim = asyncHandler(async (req, res) => {
    const { claimId } = req.params;

    const claim = await LostFoundClaim.findById(claimId);

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    if (claim.postOwner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only post owner can verify claims");
    }

    if (claim.status !== 'VERIFICATION') {
        throw new ApiError(400, "Claim must be in verification status");
    }

    claim.status = 'VERIFIED';
    claim.chatEnabled = true;
    claim.timeline.push({
        action: 'CLAIM_VERIFIED',
        by: req.user._id,
        details: 'Claim verified, chat enabled'
    });
    await claim.save();

    const post = await LostFound.findById(claim.post);
    post.status = 'VERIFIED';
    await post.save();

    await createNotificationHelper(
        claim.claimant,
        'LOST_FOUND_VERIFIED',
        `Your claim has been verified! You can now chat with the owner.`,
        claim._id,
        'LostFoundClaim'
    );

    return res.status(200).json(
        new ApiResponse(200, claim, "CLAIM VERIFIED SUCCESSFULLY")
    );
});

const rejectClaim = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const { reason } = req.body;

    const claim = await LostFoundClaim.findById(claimId);

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    if (claim.postOwner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only post owner can reject claims");
    }

    if (['RESOLVED', 'REJECTED'].includes(claim.status)) {
        throw new ApiError(400, "Claim cannot be rejected");
    }

    claim.status = 'REJECTED';
    claim.timeline.push({
        action: 'CLAIM_REJECTED',
        by: req.user._id,
        details: reason || 'Claim rejected by owner'
    });
    await claim.save();

    await createNotificationHelper(
        claim.claimant,
        'LOST_FOUND_REJECTED',
        `Your claim has been rejected. ${reason || ''}`,
        claim._id,
        'LostFoundClaim'
    );

    return res.status(200).json(
        new ApiResponse(200, claim, "CLAIM REJECTED")
    );
});

const proposeMeetup = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const { proposedLocation, proposedTime } = req.body;

    if (!proposedLocation || !proposedTime) {
        throw new ApiError(400, "Location and time are required");
    }

    const claim = await LostFoundClaim.findById(claimId);

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    const isOwner = claim.postOwner.toString() === req.user._id.toString();
    const isClaimant = claim.claimant.toString() === req.user._id.toString();

    if (!isOwner && !isClaimant) {
        throw new ApiError(403, "Only participants can propose meetup");
    }

    if (claim.status !== 'VERIFIED') {
        throw new ApiError(400, "Claim must be verified to propose meetup");
    }

    claim.meetupDetails = {
        proposedLocation,
        proposedTime: new Date(proposedTime),
        status: 'PROPOSED'
    };
    claim.timeline.push({
        action: 'MEETUP_PROPOSED',
        by: req.user._id,
        details: `Meetup proposed at ${proposedLocation} on ${proposedTime}`
    });
    await claim.save();

    const notifyUserId = isOwner ? claim.claimant : claim.postOwner;
    await createNotificationHelper(
        notifyUserId,
        'LOST_FOUND_MEETUP',
        `A meetup has been proposed at ${proposedLocation}`,
        claim._id,
        'LostFoundClaim'
    );

    return res.status(200).json(
        new ApiResponse(200, claim, "MEETUP PROPOSED SUCCESSFULLY")
    );
});

const acceptMeetup = asyncHandler(async (req, res) => {
    const { claimId } = req.params;

    const claim = await LostFoundClaim.findById(claimId);

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    const isOwner = claim.postOwner.toString() === req.user._id.toString();
    const isClaimant = claim.claimant.toString() === req.user._id.toString();

    if (!isOwner && !isClaimant) {
        throw new ApiError(403, "Only participants can accept meetup");
    }

    if (claim.meetupDetails.status !== 'PROPOSED') {
        throw new ApiError(400, "No meetup proposal to accept");
    }

    claim.meetupDetails.agreedLocation = claim.meetupDetails.proposedLocation;
    claim.meetupDetails.agreedTime = claim.meetupDetails.proposedTime;
    claim.meetupDetails.status = 'AGREED';
    claim.timeline.push({
        action: 'MEETUP_ACCEPTED',
        by: req.user._id,
        details: 'Meetup proposal accepted'
    });
    await claim.save();

    const notifyUserId = isOwner ? claim.claimant : claim.postOwner;
    await createNotificationHelper(
        notifyUserId,
        'LOST_FOUND_MEETUP_ACCEPTED',
        `Meetup has been confirmed for ${claim.meetupDetails.agreedLocation}`,
        claim._id,
        'LostFoundClaim'
    );

    return res.status(200).json(
        new ApiResponse(200, claim, "MEETUP ACCEPTED")
    );
});

const resolvePost = asyncHandler(async (req, res) => {
    const { postId, claimId } = req.params;

    const post = await LostFound.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only post owner can resolve");
    }

    const claim = await LostFoundClaim.findById(claimId);
    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    if (claim.post.toString() !== postId) {
        throw new ApiError(400, "Claim does not belong to this post");
    }

    post.status = 'RESOLVED';
    post.isResolved = true;
    post.resolvedWith = claim.claimant;
    post.resolvedAt = new Date();
    await post.save();

    claim.status = 'RESOLVED';
    claim.meetupDetails.status = 'COMPLETED';
    claim.timeline.push({
        action: 'POST_RESOLVED',
        by: req.user._id,
        details: 'Post marked as resolved with this claim'
    });
    await claim.save();

    await LostFoundClaim.updateMany(
        { post: postId, _id: { $ne: claimId } },
        { 
            $set: { status: 'CANCELLED' },
            $push: { 
                timeline: {
                    action: 'CLAIM_CANCELLED',
                    by: req.user._id,
                    details: 'Post resolved with another claim'
                }
            }
        }
    );

    await createNotificationHelper(
        claim.claimant,
        'LOST_FOUND_RESOLVED',
        `The item has been successfully returned/claimed!`,
        claim._id,
        'LostFoundClaim'
    );

    return res.status(200).json(
        new ApiResponse(200, { post, claim }, "POST RESOLVED SUCCESSFULLY")
    );
});

const getClaimById = asyncHandler(async (req, res) => {
    const { claimId } = req.params;
    const userId = req.user._id;

    const claim = await LostFoundClaim.findById(claimId)
        .populate('post', 'title type location photo user')
        .populate('claimant', 'fullName username avatar trustScore')
        .populate('post.user', 'fullName username avatar');

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    const isPostOwner = claim.post.user.toString() === userId.toString();
    const isClaimant = claim.claimant._id.toString() === userId.toString();

    if (!isPostOwner && !isClaimant) {
        throw new ApiError(403, "You are not authorized to view this claim");
    }

    return res.status(200).json(
        new ApiResponse(200, claim, "CLAIM FETCHED SUCCESSFULLY")
    );
});

export {
    createPost,
    updatePost,
    getPosts,
    getMyPosts,
    getPostDetail,
    markResolved,
    deletePost,
    createClaim,
    getPostClaims,
    getMyClaims,
    getReceivedClaims,
    startVerification,
    submitVerification,
    verifyClaim,
    rejectClaim,
    proposeMeetup,
    acceptMeetup,
    resolvePost,
    getClaimById
};
