import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ticketsRouter from "./tickets";
import attachmentsRouter from "./attachments";
import kbRouter from "./kb";
import statsRouter from "./stats";
import githubRouter from "./github";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ticketsRouter);
router.use(attachmentsRouter);
router.use(kbRouter);
router.use(statsRouter);
router.use(githubRouter);

export default router;
