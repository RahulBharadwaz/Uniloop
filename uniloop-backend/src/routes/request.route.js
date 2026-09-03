import { Router } from "express";
import {
    createRequest,
    getMyRequests,
    getReceivedRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    getActiveRequests,
    instantClaim,
    getClaimQueue,
    confirmPickup,
    createCounterOffer,
    respondToCounterOffer,
    getItemRequests,
    proposePickupDetails,
    confirmPickupDetails
} from "../controllers/request.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(VerifyJWT);

router.route("/").post(createRequest);
router.route("/my-requests").get(getMyRequests);
router.route("/received").get(getReceivedRequests);
router.route("/active").get(getActiveRequests);
router.route("/:requestId/accept").post(acceptRequest);
router.route("/:requestId/reject").post(rejectRequest);
router.route("/:requestId/cancel").post(cancelRequest);

router.post("/instant-claim/:itemId", instantClaim);
router.get("/claim-queue/:itemId", getClaimQueue);

router.patch("/:requestId/confirm-pickup", confirmPickup);
router.post("/:requestId/pickup-details", proposePickupDetails);
router.patch("/:requestId/confirm-pickup-details", confirmPickupDetails);

router.post("/:requestId/counter-offer", createCounterOffer);
router.patch("/:requestId/counter-offer/respond", respondToCounterOffer);

router.get("/item/:itemId", getItemRequests);

export default router;
