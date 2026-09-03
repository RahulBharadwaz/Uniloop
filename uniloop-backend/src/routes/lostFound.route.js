import { Router } from "express";
import {
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
} from "../controllers/lostFound.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(VerifyJWT);

// Posts
router.route("/").post(upload.single("photo"), createPost);
router.route("/").get(getPosts);
router.route("/my-posts").get(getMyPosts);
router.route("/:postId").get(getPostDetail);
router.route("/:postId").put(upload.single("photo"), updatePost);
router.route("/:postId/claims").get(getPostClaims);
router.route("/:postId/resolve").patch(markResolved);
router.route("/:postId").delete(deletePost);

// Claims
router.route("/:postId/claim").post(createClaim);
router.route("/claims/sent").get(getMyClaims);
router.route("/claims/received").get(getReceivedClaims);
router.route("/claims/:claimId").get(getClaimById);
router.route("/claims/:claimId/start-verification").patch(startVerification);
router.route("/claims/:claimId/submit-verification").post(submitVerification);
router.route("/claims/:claimId/verify").patch(verifyClaim);
router.route("/claims/:claimId/reject").patch(rejectClaim);
router.route("/claims/:claimId/propose-meetup").post(proposeMeetup);
router.route("/claims/:claimId/accept-meetup").patch(acceptMeetup);
router.route("/:postId/resolve/:claimId").patch(resolvePost);

export default router;
