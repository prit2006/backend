const express = require("express");
const adminRouter = express.Router();
const { adminAuth } = require("../middlewares/auth");
const User = require("../models/user");
const Post = require("../models/post");
const Project = require("../models/project");

// GET /admin/stats
adminRouter.get("/stats", adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPosts = await Post.countDocuments();
        const totalProjects = await Project.countDocuments();
        // For recent activities we can return the latest 5 users and latest 5 posts
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
        const recentPosts = await Post.find().populate("userId", "firstname lastname photoURL").sort({ createdAt: -1 }).limit(5);
        res.json({ totalUsers, totalPosts, totalProjects, recentUsers, recentPosts });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /admin/users
adminRouter.get("/users", adminAuth, async (req, res) => {
    try {
        // Optional basic search/filter can go here based on req.query
        const filter = {};
        if (req.query.search) {
            filter.$or = [
                { firstname: { $regex: req.query.search, $options: "i" } },
                { lastname: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } }
            ];
        }
        const users = await User.find(filter).select("-pass");
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /admin/users/:id
adminRouter.get("/users/:id", adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-pass");
        if (!user) return res.status(404).send("User not found");
        const posts = await Post.find({ userId: user._id });
        const projects = await Project.find({ ownerId: user._id });
        res.json({ user, posts, projects });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT /admin/users/:id
adminRouter.put("/users/:id", adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-pass");
        if (!user) return res.status(404).send("User not found");
        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE /admin/users/:id
adminRouter.delete("/users/:id", adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).send("User not found");
        // also delete their posts and projects
        await Post.deleteMany({ userId: user._id });
        await Project.deleteMany({ ownerId: user._id });
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /admin/posts
adminRouter.get("/posts", adminAuth, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("userId", "firstname lastname email photoURL")
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT /admin/posts/:id/status
adminRouter.put("/posts/:id/status", adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const post = await Post.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!post) return res.status(404).send("Post not found");
        res.json(post);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE /admin/posts/:id
adminRouter.delete("/posts/:id", adminAuth, async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).send("Post not found");
        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /admin/projects
adminRouter.get("/projects", adminAuth, async (req, res) => {
    try {
        const projects = await Project.find()
            .populate("ownerId", "firstname lastname email photoURL")
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /admin/projects/:id
adminRouter.get("/projects/:id", adminAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate("ownerId", "firstname lastname email photoURL");
        if (!project) return res.status(404).send("Project not found");
        res.json(project);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE /admin/projects/:id
adminRouter.delete("/projects/:id", adminAuth, async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).send("Project not found");
        res.json({ message: "Project deleted successfully" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = adminRouter;
