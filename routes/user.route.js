import express from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import {
    getUsers,
    getUserById
} from '../controllers/user.controller.js';
const router = express.Router();

router.get("/",protect,adminOnly,getUsers);
router.get("/:id",protect,getUserById);
export default router;