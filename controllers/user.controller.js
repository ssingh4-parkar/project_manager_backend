import taskModel from "../models/task.model.js";
import userModel from "../models/user.model.js";
// import bcrypt from "bcryptjs"; // Not used in this snippet

const getUsers = async (req, res) => {
    try {
        // Changed from 'member' to just finding all users since role management is now dynamic
        const users = await userModel.find({}).select("-password");
        const usersWithTaskCounts = await Promise.all(users.map(async (user) => {
            const pendingTasks = await taskModel.countDocuments({ assignedTo: user._id, status: "pending" });
            const inProgressTasks = await taskModel.countDocuments({ assignedTo: user._id, status: "in progress" });
            const completedTasks = await taskModel.countDocuments({ assignedTo: user._id, status: "completed" });
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
        const user = await userModel.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
}

// *** NEW FUNCTION ***
const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }
        
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Optional safety check: prevent an admin from demoting themselves
        if (user._id.toString() === req.user._id.toString()) {
             return res.status(403).json({ message: "Cannot change your own role." });
        }

        user.role = role;
        await user.save();

        // Return the updated user object so the frontend can refresh its state
        res.status(200).json({ message: "User role updated successfully", user });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


export {
    getUsers,
    getUserById,
    updateUserRole // Export the new function
}
