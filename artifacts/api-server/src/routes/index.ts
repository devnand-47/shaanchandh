import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import projectsRouter from "./projects";
import messagesRouter from "./messages";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(projectsRouter);
router.use(messagesRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);

export default router;
