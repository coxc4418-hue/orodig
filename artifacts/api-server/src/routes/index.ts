import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import membersRouter from "./members";
import earningsRouter from "./earnings";
import leaderboardRouter from "./leaderboard";
import productsRouter from "./products";
import withdrawalsRouter from "./withdrawals";
import depositsRouter from "./deposits";
import networkRouter from "./network";
import adminRouter from "./admin";
import referralsRouter from "./referrals";
import communityRouter from "./community";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(membersRouter);
router.use(earningsRouter);
router.use(leaderboardRouter);
router.use(productsRouter);
router.use(withdrawalsRouter);
router.use(depositsRouter);
router.use(networkRouter);
router.use(adminRouter);
router.use(referralsRouter);
router.use(communityRouter);

export default router;
