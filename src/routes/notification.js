const express = require("express");
const notificationRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const Notification = require("../models/notification");

// Fetch all notifications for the logged-in user
notificationRouter.get("/", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({ receiverId: userId })
            .sort({ createdAt: -1 })
            .populate("senderId", "firstname lastname photoURL"); // Populate sender info for display

        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark a single notification as read
notificationRouter.patch("/:notificationId/read", userAuth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, receiverId: userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found or unauthorized." });
        }

        res.status(200).json({ message: "Notification marked as read", notification });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark all notifications as read
notificationRouter.patch("/mark-all-read", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { receiverId: userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a notification (optional, but good for cleanup)
notificationRouter.delete("/:notificationId", userAuth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const deletedNotification = await Notification.findOneAndDelete({
            _id: notificationId,
            receiverId: userId
        });

        if (!deletedNotification) {
            return res.status(404).json({ message: "Notification not found or unauthorized." });
        }
        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = notificationRouter;
