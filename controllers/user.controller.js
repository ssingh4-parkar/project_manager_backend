import taskModel from "../models/task.model.js";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";

const getUsers = async (req, res) => {
    try {
        const users = await userModel.find({ role: 'member' }).select("-password");
        const usersWithTaskCounts = await Promise.all(users.map(async (user) => {
            const pendingTasks = await taskModel.countDocuments({ assignedTo: user._id, status: "pending" });
            const inProgressTasks = await taskModel.countDocuments({ assignedTo: user._id, status: "In progress" });
            const completedTasks = await taskModel.countDocuments({ assignedTo: user._id, status: "Completed" });
            return {
                ...user._doc,
                pendingTasks,
                inProgressTasks,
                completedTasks
            }
        }))
        res.json(usersWithTaskCounts);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
}

const getUserById = async (req, res) => {
    try {
        const user=await userModel.findById(req.params.id).select("-password");
        if(!user){
            return res.status(404).json({message:"User not found"})
        }
        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
}


export {
    getUsers,
    getUserById
}