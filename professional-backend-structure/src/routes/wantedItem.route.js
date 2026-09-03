import { Router } from "express";
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    createWantedItem,
    getWantedItems,
    getMyWantedItems,
    getWantedItemDetail,
    updateWantedItem,
    deleteWantedItem,
    makeOffer,
    getMyOffers,
    getOffersReceived,
    acceptOffer,
    rejectOffer,
    cancelOffer,
    markFulfilled,
    getOfferById
} from "../controllers/wantedItem.controller.js";

const router = Router();
router.use(VerifyJWT);

router.post("/", upload.single("referenceImage"), createWantedItem);
router.get("/", getWantedItems);
router.get("/my-posts", getMyWantedItems);
router.get("/my-offers", getMyOffers);
router.get("/offers-received", getOffersReceived);
router.get("/:id", getWantedItemDetail);
router.put("/:id", upload.single("referenceImage"), updateWantedItem);
router.delete("/:id", deleteWantedItem);
router.patch("/:id/fulfill", markFulfilled);

router.post("/:id/offers", upload.array("photos", 3), makeOffer);
router.patch("/:id/offers/:offerId/accept", acceptOffer);
router.patch("/:id/offers/:offerId/reject", rejectOffer);
router.delete("/:id/offers/:offerId", cancelOffer);

// Single offer route
router.get("/offers/:offerId", getOfferById);

export default router;
