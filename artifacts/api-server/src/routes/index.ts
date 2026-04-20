import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tasksRouter from "./tasks";
import udhaarRouter from "./udhaar";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/tasks", tasksRouter);
router.use("/udhaar", udhaarRouter);

export default router;
