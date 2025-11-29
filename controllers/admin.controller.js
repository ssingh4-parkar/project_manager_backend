import userModel from "../models/user.model.js";

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ["admin", "member"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role. Use 'admin' or 'member'" });
        }

        const user = await userModel.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.role = role;
        await user.save();

        return res.status(200).json({
            message: "User role updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImageUrl: user.profileImageUrl || ""
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export {
    updateUserRole
};