import taskModel from "../models/task.model.js";


const getTasks = async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};
        if (status) {
            filter.status = status;
        }
        let tasks;
        if (req.user.role === "admin") {
            tasks = await taskModel.find(filter).populate(
                "assignedTo",
                "name email profileImageUrl"
            )
        } else {
            tasks = await taskModel.find({ ...filter, assignedTo: req.user._id }).populate(
                "assignedTo",
                "name email profileImageUrl"
            )
        }
        tasks = await Promise.all(
            tasks.map(async (task) => {
                const completedCount = task.todoChecklist.filter((item) => item.completed).length;
                return { ...task._doc, completedTodoCount: completedCount }
            })
        )

        const allTasks = await taskModel.countDocuments(
            req.user.role === "admin" ? {} : { assignedTo: req.user._id }
        )
        const pendingTasks = await taskModel.countDocuments({
            ...filter,
            status: "pending",
            ...(req.user.role !== "admin" && { assignedTo: req.user._id })
        })
        const inProgressTasks = await taskModel.countDocuments({
            ...filter,
            status: "in progress",
            ...(req.user.role !== "admin" && { assignedTo: req.user._id })
        })
        const completedTasks = await taskModel.countDocuments({
            ...filter,
            status: "completed",
            ...(req.user.role !== "admin" && { assignedTo: req.user._id })
        })
        res.json({
            tasks,
            statusSummary: {
                all: allTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks
            }
        })
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

const getTaskById = async (req, res) => {
    try {
        const task = await taskModel.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        );
        if (!task) return res.status(404).json({ message: "task not found" });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, assignedTo, attachments, todoChecklist } = req.body;
        if (!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
        }
        const task = await taskModel.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user._id,
            todoChecklist,
            attachments
        })
        res.status(201).json({ message: "Task created successfully", task })
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
const updateTask = async (req, res) => {
    try {
        const task = await taskModel.findById(req.params.id);
        if (!task) return res.status(400).json({ message: "task not found" })
        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist
        task.attachments = req.body.attachments || task.attachments
        if (req.body.assignedTo) {
            if (!Array.isArray(req.body.assignedTo)) {
                return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
            }
            task.assignedTo = req.body.assignedTo;
        }
        const updatedTask = await task.save();
        res.json({ message: "task updated successfully", updatedTask });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
const deleteTask = async (req, res) => {
    try {
        const task = await taskModel.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "task not found" });
        }
        await task.deleteOne();
        res.json({ message: "task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
const updateTaskStatus = async (req, res) => {
    try {
        const task = await taskModel.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "task not found" });
        }
        
        const isAssigned = task.assignedTo.some((userId) => userId.toString() === req.user._id.toString());
        if (!isAssigned && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        task.status = req.body.status || task.status;
        
        if (task.status === "completed") {
            task.todoChecklist.forEach((item) => (item.completed = true)); // FIXED: Changed from todoChecklists
            task.progress = 100;
        }
        
        await task.save();
        res.json({ message: "task status updated", task });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
const updateTaskChecklist = async (req, res) => {
    try {
        const { todoChecklist } = req.body; // ✅ Extract from request body
        const task = await taskModel.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: "task not found" });
        }
        
        if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
            return res.status(403).json({ message: "not authorized to update checklist" });
        }
        
        task.todoChecklist = todoChecklist;

        const completedCount = task.todoChecklist.filter( 
            (item) => item.completed
        ).length;
        const totalItems = task.todoChecklist.length; 
        task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        if (task.progress === 100) {
            task.status = "completed";
        } else if (task.progress > 0) {
            task.status = "in progress";
        } else {
            task.status = "pending";
        }
        
        await task.save();
        
        const updatedTask = await taskModel.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        );
        
        res.json({ message: "task checklist updated", task: updatedTask });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
const getDashboardData = async (req, res) => {
    try {
        const totalTasks = await taskModel.countDocuments();
        const pendingTasks = await taskModel.countDocuments({ status: "pending" });
        const completedTasks = await taskModel.countDocuments({ status: "completed" });
        const overdueTasks = await taskModel.countDocuments({
            status: { $ne: "completed" },
            dueDate: { $lt: new Date() }
        });
        const taskStatuses = ["pending", "in progress", "completed"]
        const taskDistributionRaw = await taskModel.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ])
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");  //remove spaces for response keys
            acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {})
        taskDistribution["All"] = totalTasks;
        const taskPriorities = ["low", "medium", "high"];
        const taskPriorityLevelsRaw = await taskModel.aggregate([
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 }
                }
            }
        ])
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        }, {});

        const recentTasks = await taskModel.find().sort({ createdAt: -1 }).limit(10).select("title status priority dueDate createdAt");   //createdAt:-1  Sort the results by the createdAt field in descending order (newest first).
        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels
            },
            recentTasks,
        })
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;
        const totalTasks = await taskModel.countDocuments({ assignedTo: userId });
        const pendingTasks = await taskModel.countDocuments({ assignedTo: userId, status: "pending" });
        const completedTasks = await taskModel.countDocuments({ assignedTo: userId, status: "completed" });
        const overdueTasks = await taskModel.countDocuments({
            assignedTo: userId,
            status: { $ne: "completed" },
            dueDate: { $lt: new Date() }
        });
        const taskStatuses = ["pending", "in progress", "completed"]
        const taskDistributionRaw = await taskModel.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ])
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        //task distribution by priority
        const taskPriorities = ["low", "medium", "high"];
        const taskPriorityLevelsRaw = await taskModel.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$priority", count: { $sum: 1 } } }
        ])
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        }, {})

        const recentTasks = await taskModel.find({ assignedTo: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title status priority dueDate createdAt");
        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels
            },
            recentTasks,
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData
}