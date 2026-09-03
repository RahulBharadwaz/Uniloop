import { Router } from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
} from "../controllers/notification.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(VerifyJWT);

router.route("/").get(getNotifications);
router.route("/unread-count").get(getUnreadCount);
router.route("/read-all").patch(markAllAsRead);
router.route("/:notificationId/read").patch(markAsRead);

export default router;
