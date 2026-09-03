import { Router } from "express";
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    getOrCreateChat,
    getChatMessages,
    sendMessage,
    proposeMeetup,
    respondToMeetup,
    getMyOfferChats
} from "../controllers/offerChat.controller.js";

const router = Router();
router.use(VerifyJWT);

router.get("/", getMyOfferChats);
router.get("/:offerId", getOrCreateChat);
router.get("/:offerId/messages", getChatMessages);
router.post("/:offerId/messages", upload.single("image"), sendMessage);
router.post("/:offerId/meetup", proposeMeetup);
router.post("/:offerId/meetup-response", respondToMeetup);

export default router;
