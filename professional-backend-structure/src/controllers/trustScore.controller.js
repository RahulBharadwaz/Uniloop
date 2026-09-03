import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';

const TRUST_SCORE_CHANGES = {
    'ON_TIME_RETURN': 5,
    'LATE_RETURN_MINOR': -3,
    'LATE_RETURN_MAJOR': -7,
    'DISPUTE': -10,
    'COMPLETED': 2
};

const updateTrustScoreHelper = async (userId, action) => {
    try {
        const scoreChange = TRUST_SCORE_CHANGES[action];
        
        if (scoreChange === undefined) {
            console.error(`Invalid trust score action: ${action}`);
            return null;
        }

        const user = await User.findById(userId);
        
        if (!user) {
            console.error(`User not found for trust score update: ${userId}`);
            return null;
        }

        let newScore = (user.trustScore || 50) + scoreChange;
        
        newScore = Math.max(0, Math.min(100, newScore));

        user.trustScore = newScore;
        await user.save({ validateBeforeSave: false });

        return newScore;
    } catch (error) {
        console.error('Error updating trust score:', error);
        return null;
    }
};

const getTrustScore = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const targetUserId = userId || req.user._id;

    const user = await User.findById(targetUserId).select('fullName username trustScore');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const trustLevel = getTrustLevel(user.trustScore);

    return res.status(200).json(
        new ApiResponse(200, {
            userId: user._id,
            fullName: user.fullName,
            username: user.username,
            trustScore: user.trustScore,
            trustLevel
        }, "TRUST SCORE FETCHED SUCCESSFULLY")
    );
});

const getTrustLevel = (score) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'AVERAGE';
    if (score >= 20) return 'LOW';
    return 'POOR';
};

const updateTrustScore = asyncHandler(async (req, res) => {
    const { userId, action } = req.body;

    if (!userId || !action) {
        throw new ApiError(400, "User ID and action are required");
    }

    if (!TRUST_SCORE_CHANGES[action]) {
        throw new ApiError(400, "Invalid action");
    }

    const newScore = await updateTrustScoreHelper(userId, action);

    if (newScore === null) {
        throw new ApiError(500, "Failed to update trust score");
    }

    return res.status(200).json(
        new ApiResponse(200, { 
            userId, 
            newScore,
            trustLevel: getTrustLevel(newScore)
        }, "TRUST SCORE UPDATED SUCCESSFULLY")
    );
});

export {
    updateTrustScoreHelper,
    getTrustScore,
    updateTrustScore,
    TRUST_SCORE_CHANGES
};
