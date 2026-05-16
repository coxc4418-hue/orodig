import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import membersRouter from "./members";
import earningsRouter from "./earnings";
import leaderboardRouter from "./leaderboard";
import productsRouter from "./products";
import withdrawalsRouter from "./withdrawals";
import networkRouter from "./network";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(membersRouter);
router.use(earningsRouter);
router.use(leaderboardRouter);
router.use(productsRouter);
router.use(withdrawalsRouter);
router.use(networkRouter);

export default router;
