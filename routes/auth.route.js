import express from "express";
import {protect} from '../middlewares/auth.middleware.js';
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    refreshTokenHandler
} from '../controllers/auth.controller.js';
import upload from '../middlewares/upload.middleware.js';
const router = express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/profile",protect,getUserProfile);
router.put("/profile",protect,updateUserProfile);
router.post("/refresh-token", refreshTokenHandler);
router.post("/upload-image",upload.single("image"),(req,res)=>{
    if(!req.file){
        return res.status(400).json({message:"no file uploaded"})
    }
    const imageUrl=`${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({imageUrl});
});
export default router;