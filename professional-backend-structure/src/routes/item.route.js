import { Router } from "express";
import {
    createItem,
    updateItem,
    deleteItem,
    markUnavailable,
    getMyItems,
    getAllItems,
    getItemById,
    getRecommendations
} from "../controllers/item.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(VerifyJWT);

router.route("/").post(upload.array("photos", 5), createItem);
router.route("/").get(getAllItems);
router.route("/my-items").get(getMyItems);
router.route("/recommendations").get(getRecommendations);
router.route("/:itemId").get(getItemById);
router.route("/:itemId").patch(updateItem);
router.route("/:itemId").delete(deleteItem);
router.route("/:itemId/availability").patch(markUnavailable);

export default router;
