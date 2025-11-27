import express from "express";
import { adminOnly, protect } from "../middlewares/auth.middleware.js";
import {
    exportTasksReport,
    exportUsersReport
} from '../controllers/report.controller.js';
const router = express.Router();

router.get("/export/tasks",protect,adminOnly,exportTasksReport);
router.get("/export/users",protect,adminOnly,exportUsersReport);
export default router;