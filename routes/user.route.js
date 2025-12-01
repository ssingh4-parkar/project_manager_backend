import express from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import {
    getUsers,
    getUserById,
    updateUserRole // Import the new function
} from '../controllers/user.controller.js';
const router = express.Router();

router.get("/", protect, adminOnly, getUsers);
router.get("/:id", protect, getUserById);

// *** NEW ROUTE ***
router.put("/update-role/:userId", protect, adminOnly, updateUserRole);

export default router;
