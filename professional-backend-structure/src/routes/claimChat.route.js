import { Router } from "express";
import {
    getChatForClaim,
    getMessages,
    sendMessage,
    markAsRead,
    getMyChats,
    sendLocationMessage,
    proposeMeetupInChat
} from "../controllers/claimChat.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(VerifyJWT);

router.get('/claim/:claimId', getChatForClaim);
router.get('/my-chats', getMyChats);
router.get('/:chatId/messages', getMessages);
router.post('/:chatId/messages', upload.single('image'), sendMessage);
router.patch('/:chatId/read', markAsRead);
router.post('/:chatId/location', sendLocationMessage);
router.post('/:chatId/meetup-proposal', proposeMeetupInChat);

export default router;
