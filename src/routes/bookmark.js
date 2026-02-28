const express = require("express");
const bookmarkRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const Post = require("../models/post");
const Project = require("../models/project");

// --- TOGGLE BOOKMARKS ---

bookmarkRouter.patch("/post/:postId", userAuth, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const user = await User.findById(userId);
        const isSaved = user.savedPosts.includes(postId);

        if (isSaved) {
            user.savedPosts.pull(postId);
            await user.save();
            return res.json({ message: "Post removed from bookmarks", savedPosts: user.savedPosts });
        } else {
            user.savedPosts.addToSet(postId);
            await user.save();
            return res.json({ message: "Post bookmarked", savedPosts: user.savedPosts });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

bookmarkRouter.patch("/project/:projectId", userAuth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const user = await User.findById(userId);
        const isSaved = user.savedProjects.includes(projectId);

        if (isSaved) {
            user.savedProjects.pull(projectId);
            await user.save();
            return res.json({ message: "Project removed from bookmarks", savedProjects: user.savedProjects });
        } else {
            user.savedProjects.addToSet(projectId);
            await user.save();
            return res.json({ message: "Project bookmarked", savedProjects: user.savedProjects });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- FETCH BOOKMARKS ---

bookmarkRouter.get("/posts", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        // Populate the savedPosts array
        const user = await User.findById(userId).populate({
            path: "savedPosts",
            populate: [
                { path: "userId", select: "firstname lastname photoURL" },
                { path: "comments.userId", select: "firstname lastname photoURL" }
            ]
        });

        res.json(user.savedPosts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

bookmarkRouter.get("/projects", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        // Populate the savedProjects array
        const user = await User.findById(userId).populate({
            path: "savedProjects",
            populate: { path: "ownerId", select: "firstname lastname photoURL" }
        });

        res.json(user.savedProjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = bookmarkRouter;
