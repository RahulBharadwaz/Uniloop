import { Router } from "express";
import {
    sendMessage,
    getMessages
} from "../controllers/message.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(VerifyJWT);

router.route("/:transactionId").post(sendMessage);
router.route("/:transactionId").get(getMessages);

export default router;
