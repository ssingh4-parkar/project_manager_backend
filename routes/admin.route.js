import express from "express";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";
import { updateUserRole } from "../controllers/admin.controller.js";

const router = express.Router();

router.put("/users/:id/role", protect, adminOnly, updateUserRole);

export default router;