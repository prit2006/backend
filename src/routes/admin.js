const express = require("express");
const adminRouter = express.Router();
const { adminAuth } = require("../middlewares/auth");
const User = require("../models/user");
const Post = require("../models/post");
const Project = require("../models/project");
const Job = require("../models/job");
const Application = require("../models/application");
const Payment = require("../models/payment");
const nodemailer = require("nodemailer");

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

// POST /admin/jobs
adminRouter.post("/jobs", adminAuth, async (req, res) => {
    try {
        const { title, company, role, skills, description, eligibility, deadline } = req.body;
        const job = new Job({ title, company, role, skills, description, eligibility, deadline });
        await job.save();
        res.status(201).json(job);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /admin/jobs
adminRouter.get("/jobs", adminAuth, async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE /admin/jobs/:id
adminRouter.delete("/jobs/:id", adminAuth, async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) return res.status(404).send("Job not found");
        await Application.deleteMany({ jobId: req.params.id });
        res.json({ message: "Job deleted successfully" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /admin/applications
adminRouter.get("/applications", adminAuth, async (req, res) => {
    try {
        const applications = await Application.find()
            .populate("userId", "firstname lastname email photoURL")
            .populate("jobId", "title company role")
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PATCH /admin/applications/:id/verify
adminRouter.patch("/applications/:id/verify", adminAuth, async (req, res) => {
    try {

        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status: "verified" },
            { returnDocument: "after" }   // ✅ FIX
        )
        .populate("userId", "firstname lastname email")
        .populate("jobId", "title company");

        if (!application) {
            return res.status(404).send("Application not found");
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "pritpastagiya2006@gmail.com",
                pass: "aiizxilblnwswcer"
            }
        });

        const mailOptions = {
            from: "DevSwipe <pritpastagiya2006@gmail.com>",
            to: application.userId.email,
            subject: `Congratulations! You have been selected for ${application.jobId.title}`,
            text: `
Dear ${application.userId.firstname},

Congratulations!

Your application for the role of ${application.jobId.title} at ${application.jobId.company} has been verified by our admin.

You may be contacted by the company soon.

Best Regards,
DevSwipe Team
`
        };

        await transporter.sendMail(mailOptions);

        res.json({
            message: "Application verified and email sent",
            application
        });

    } catch (err) {
        res.status(500).send(err.message);
    }
});

// ─── PAYMENT MANAGEMENT ──────────────────────────────────────────────────────

// GET /admin/payments - List all payments with user info, supports status filter & search
adminRouter.get("/payments", adminAuth, async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.search) {
            const regex = { $regex: req.query.search, $options: "i" };
            filter.$or = [
                { orderId: regex },
                { paymentId: regex },
                { receipt: regex },
                { "notes.membershipType": regex }
            ];
        }
        const payments = await Payment.find(filter)
            .populate("userId", "firstname lastname email photoURL isPremium membershipType")
            .sort({ createdAt: -1 });
        const totalRevenue = await Payment.aggregate([
            { $match: { status: "captured" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const statusCounts = await Payment.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const membershipCounts = await Payment.aggregate([
            { $group: { _id: "$notes.membershipType", count: { $sum: 1 }, revenue: { $sum: "$amount" } } }
        ]);
        res.json({
            payments,
            stats: {
                totalRevenue: totalRevenue[0]?.total || 0,
                statusCounts,
                membershipCounts
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /admin/payments/:id - Get single payment detail
adminRouter.get("/payments/:id", adminAuth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate("userId", "firstname lastname email photoURL isPremium membershipType");
        if (!payment) return res.status(404).send("Payment not found");
        res.json(payment);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PATCH /admin/payments/:id/status - Update payment status
adminRouter.patch("/payments/:id/status", adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["created", "captured", "failed", "refunded"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}` });
        }
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate("userId", "firstname lastname email photoURL");
        if (!payment) return res.status(404).send("Payment not found");

        // Sync user premium status when payment is captured or refunded
        if (status === "captured") {
            await User.findByIdAndUpdate(payment.userId._id, {
                isPremium: true,
                membershipType: payment.notes?.membershipType || "silver"
            });
        } else if (status === "refunded" || status === "failed") {
            // Check if user has another captured payment before revoking
            const otherCaptured = await Payment.findOne({
                userId: payment.userId._id,
                status: "captured",
                _id: { $ne: payment._id }
            });
            if (!otherCaptured) {
                await User.findByIdAndUpdate(payment.userId._id, {
                    isPremium: false,
                    membershipType: "free"
                });
            }
        }
        res.json(payment);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PATCH /admin/payments/:id/extend - Extend / upgrade membership type
adminRouter.patch("/payments/:id/extend", adminAuth, async (req, res) => {
    try {
        const { membershipType, extendMonths } = req.body;
        const payment = await Payment.findById(req.params.id).populate("userId", "firstname lastname email");
        if (!payment) return res.status(404).send("Payment not found");

        if (membershipType) {
            payment.notes = { ...payment.notes, membershipType };
            await payment.save();
            // Update user membership too
            await User.findByIdAndUpdate(payment.userId._id, { membershipType });
        }

        res.json({
            message: `Membership ${ membershipType ? `updated to ${membershipType}` : "" }${ extendMonths ? ` extended by ${extendMonths} month(s)` : "" }`,
            payment
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE /admin/payments/:id - Delete a payment record
adminRouter.delete("/payments/:id", adminAuth, async (req, res) => {
    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);
        if (!payment) return res.status(404).send("Payment not found");
        res.json({ message: "Payment deleted successfully" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = adminRouter;
