import { Router } from "express";
import {
    getTransaction,
    getMyTransactions,
    proposeAgreement,
    confirmAgreement,
    markReturnPending,
    confirmReturn,
    raiseDispute
} from "../controllers/transaction.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(VerifyJWT);

router.route("/").get(getMyTransactions);
router.route("/:transactionId").get(getTransaction);
router.route("/:transactionId/propose-agreement").post(proposeAgreement);
router.route("/:transactionId/confirm-agreement").post(confirmAgreement);
router.route("/:transactionId/mark-returned").post(markReturnPending);
router.route("/:transactionId/confirm-return").post(confirmReturn);
router.route("/:transactionId/dispute").post(raiseDispute);

export default router;
