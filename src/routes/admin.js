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
        const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
        const totalPosts = await Post.countDocuments();
        const totalProjects = await Project.countDocuments();
        const recentUsers = await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).limit(5);
        const recentPosts = await Post.find().populate("userId", "firstname lastname photoURL").sort({ createdAt: -1 }).limit(5);
        res.json({ totalUsers, totalPosts, totalProjects, recentUsers, recentPosts });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /admin/users
adminRouter.get("/users", adminAuth, async (req, res) => {
    try {
        const filter = { role: { $ne: "admin" } }; // ✅ FIX: exclude admin users
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
        const user = await User.findOne({ _id: req.params.id, role: { $ne: "admin" } }).select("-pass"); // ✅ FIX
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
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, role: { $ne: "admin" } }, // ✅ FIX: prevent editing admin
            req.body,
            { new: true }
        ).select("-pass");
        if (!user) return res.status(404).send("User not found");
        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE /admin/users/:id
adminRouter.delete("/users/:id", adminAuth, async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ _id: req.params.id, role: { $ne: "admin" } }); // ✅ FIX
        if (!user) return res.status(404).send("User not found");
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
            { returnDocument: "after" }
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

//         const mailOptions = {
//             from: "DevSwipe <pritpastagiya2006@gmail.com>",
//             to: application.userId.email,
//             subject: `Congratulations! You have been selected for ${application.jobId.title}`,
//             text: `
// Dear ${application.userId.firstname},

// Congratulations!

// Your application for the role of ${application.jobId.title} at ${application.jobId.company} has been verified by our admin.

// You may be contacted by the company soon.

// Best Regards,
// DevSwipe Team
// `
//         };

const congratsEmailHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DevSwipe – Application Selected</title>
</head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:linear-gradient(135deg,#0d0d1a 0%,#120820 40%,#1a0a1e 70%,#0a0a12 100%);min-height:100vh;">
    <tr>
      <td align="center" valign="middle" style="padding:48px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px;width:100%;background:linear-gradient(160deg,#1a1a2e 0%,#16162a 50%,#1a1226 100%);border-radius:20px;border:1px solid rgba(139,92,246,0.18);box-shadow:0 0 60px rgba(139,92,246,0.12),0 32px 64px rgba(0,0,0,0.6);">
          <tr><td style="padding:0;"><div style="height:3px;background:linear-gradient(90deg,transparent,#7c3aed 30%,#a855f7 55%,#ec4899 80%,transparent);border-radius:20px 20px 0 0;"></div></td></tr>
          <tr><td align="center" style="padding:44px 40px 0;"><div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#4c1d95,#7c3aed);display:inline-block;box-shadow:0 0 28px rgba(139,92,246,0.45);line-height:72px;text-align:center;font-size:30px;">🎉</div></td></tr>
          <tr><td align="center" style="padding:28px 40px 6px;"><h1 style="margin:0;font-size:34px;font-weight:800;color:#ffffff;">Congratulations!</h1><p style="margin:10px 0 0;font-size:15px;color:#9ca3af;">Your application has been selected</p></td></tr>
          <tr><td style="padding:24px 40px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.25),transparent);"></div></td></tr>
          <tr><td style="padding:28px 40px 0;"><p style="margin:0;font-size:15px;color:#c4b5fd;line-height:1.7;">Dear <strong style="color:#e9d5ff;">${application.userId.firstname}</strong>,<br/><br/>We are thrilled to inform you that your application for the role of <strong style="color:#a855f7;">${application.jobId.title}</strong> at <strong style="color:#e9d5ff;">${application.jobId.company}</strong> has been verified and selected by our admin.</p></td></tr>
          <tr><td align="center" style="padding:32px 40px;"><div style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08));border:1px solid rgba(139,92,246,0.35);border-radius:14px;padding:28px 40px;box-shadow:0 8px 32px rgba(139,92,246,0.15);">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7c3aed;font-weight:600;">Position</p>
            <p style="margin:0 0 20px;font-size:22px;font-weight:900;color:#ffffff;text-shadow:0 0 24px rgba(168,85,247,0.4);">${application.jobId.title}</p>
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7c3aed;font-weight:600;">Company</p>
            <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;text-shadow:0 0 24px rgba(168,85,247,0.4);">${application.jobId.company}</p>
          </div></td></tr>
          <tr><td style="padding:0 40px 28px;"><div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:14px 18px;"><p style="margin:0;font-size:13px;color:#86efac;line-height:1.6;">✅ &nbsp;You may be contacted by the company soon. Keep an eye on your inbox!</p></div></td></tr>
          <tr><td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.2),transparent);"></div></td></tr>
          <tr><td align="center" style="padding:28px 40px 40px;"><p style="margin:0 0 4px;font-size:13px;color:#9ca3af;">Best Regards,</p><p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#a855f7;">DevSwipe Team</p><p style="margin:0;font-size:12px;color:#6b7280;">🛡️ &nbsp;Secured by industry-standard encryption</p></td></tr>
          <tr><td><div style="height:2px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent);border-radius:0 0 20px 20px;"></div></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const mailOptions = {
  from: "DevSwipe <pritpastagiya2006@gmail.com>",
  to: application.userId.email,
  subject: `Congratulations! You have been selected for ${application.jobId.title}`,
  text: `Dear ${application.userId.firstname},\n\nCongratulations!\n\nYour application for the role of ${application.jobId.title} at ${application.jobId.company} has been verified by our admin.\n\nYou may be contacted by the company soon.\n\nBest Regards,\nDevSwipe Team`,
  html: congratsEmailHTML,
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

// GET /admin/payments
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

// GET /admin/payments/:id
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

// PATCH /admin/payments/:id/status
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

        if (status === "captured") {
            await User.findByIdAndUpdate(payment.userId._id, {
                isPremium: true,
                membershipType: payment.notes?.membershipType || "silver"
            });
        } else if (status === "refunded" || status === "failed") {
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

// PATCH /admin/payments/:id/extend
adminRouter.patch("/payments/:id/extend", adminAuth, async (req, res) => {
    try {
        const { membershipType, extendMonths } = req.body;
        const payment = await Payment.findById(req.params.id).populate("userId", "firstname lastname email");
        if (!payment) return res.status(404).send("Payment not found");

        if (membershipType) {
            payment.notes = { ...payment.notes, membershipType };
            await payment.save();
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

// DELETE /admin/payments/:id
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

// const express = require("express");
// const adminRouter = express.Router();
// const { adminAuth } = require("../middlewares/auth");
// const User = require("../models/user");
// const Post = require("../models/post");
// const Project = require("../models/project");
// const Job = require("../models/job");
// const Application = require("../models/application");
// const Payment = require("../models/payment");
// const nodemailer = require("nodemailer");

// // GET /admin/stats
// adminRouter.get("/stats", adminAuth, async (req, res) => {
//     try {
//         const totalUsers = await User.countDocuments();
//         const totalPosts = await Post.countDocuments();
//         const totalProjects = await Project.countDocuments();
//         // For recent activities we can return the latest 5 users and latest 5 posts
//         const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
//         const recentPosts = await Post.find().populate("userId", "firstname lastname photoURL").sort({ createdAt: -1 }).limit(5);
//         res.json({ totalUsers, totalPosts, totalProjects, recentUsers, recentPosts });
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // GET /admin/users
// adminRouter.get("/users", adminAuth, async (req, res) => {
//     try {
//         // Optional basic search/filter can go here based on req.query
//         const filter = {};
//         if (req.query.search) {
//             filter.$or = [
//                 { firstname: { $regex: req.query.search, $options: "i" } },
//                 { lastname: { $regex: req.query.search, $options: "i" } },
//                 { email: { $regex: req.query.search, $options: "i" } }
//             ];
//         }
//         const users = await User.find(filter).select("-pass");
//         res.json(users);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // GET /admin/users/:id
// adminRouter.get("/users/:id", adminAuth, async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id).select("-pass");
//         if (!user) return res.status(404).send("User not found");
//         const posts = await Post.find({ userId: user._id });
//         const projects = await Project.find({ ownerId: user._id });
//         res.json({ user, posts, projects });
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // PUT /admin/users/:id
// adminRouter.put("/users/:id", adminAuth, async (req, res) => {
//     try {
//         const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-pass");
//         if (!user) return res.status(404).send("User not found");
//         res.json(user);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // DELETE /admin/users/:id
// adminRouter.delete("/users/:id", adminAuth, async (req, res) => {
//     try {
//         const user = await User.findByIdAndDelete(req.params.id);
//         if (!user) return res.status(404).send("User not found");
//         // also delete their posts and projects
//         await Post.deleteMany({ userId: user._id });
//         await Project.deleteMany({ ownerId: user._id });
//         res.json({ message: "User deleted successfully" });
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // GET /admin/posts
// adminRouter.get("/posts", adminAuth, async (req, res) => {
//     try {
//         const posts = await Post.find()
//             .populate("userId", "firstname lastname email photoURL")
//             .sort({ createdAt: -1 });
//         res.json(posts);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // PUT /admin/posts/:id/status
// adminRouter.put("/posts/:id/status", adminAuth, async (req, res) => {
//     try {
//         const { status } = req.body;
//         const post = await Post.findByIdAndUpdate(req.params.id, { status }, { new: true });
//         if (!post) return res.status(404).send("Post not found");
//         res.json(post);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // DELETE /admin/posts/:id
// adminRouter.delete("/posts/:id", adminAuth, async (req, res) => {
//     try {
//         const post = await Post.findByIdAndDelete(req.params.id);
//         if (!post) return res.status(404).send("Post not found");
//         res.json({ message: "Post deleted successfully" });
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // GET /admin/projects
// adminRouter.get("/projects", adminAuth, async (req, res) => {
//     try {
//         const projects = await Project.find()
//             .populate("ownerId", "firstname lastname email photoURL")
//             .sort({ createdAt: -1 });
//         res.json(projects);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // GET /admin/projects/:id
// adminRouter.get("/projects/:id", adminAuth, async (req, res) => {
//     try {
//         const project = await Project.findById(req.params.id).populate("ownerId", "firstname lastname email photoURL");
//         if (!project) return res.status(404).send("Project not found");
//         res.json(project);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // DELETE /admin/projects/:id
// adminRouter.delete("/projects/:id", adminAuth, async (req, res) => {
//     try {
//         const project = await Project.findByIdAndDelete(req.params.id);
//         if (!project) return res.status(404).send("Project not found");
//         res.json({ message: "Project deleted successfully" });
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // POST /admin/jobs
// adminRouter.post("/jobs", adminAuth, async (req, res) => {
//     try {
//         const { title, company, role, skills, description, eligibility, deadline } = req.body;
//         const job = new Job({ title, company, role, skills, description, eligibility, deadline });
//         await job.save();
//         res.status(201).json(job);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // GET /admin/jobs
// adminRouter.get("/jobs", adminAuth, async (req, res) => {
//     try {
//         const jobs = await Job.find().sort({ createdAt: -1 });
//         res.json(jobs);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // DELETE /admin/jobs/:id
// adminRouter.delete("/jobs/:id", adminAuth, async (req, res) => {
//     try {
//         const job = await Job.findByIdAndDelete(req.params.id);
//         if (!job) return res.status(404).send("Job not found");
//         await Application.deleteMany({ jobId: req.params.id });
//         res.json({ message: "Job deleted successfully" });
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // GET /admin/applications
// adminRouter.get("/applications", adminAuth, async (req, res) => {
//     try {
//         const applications = await Application.find()
//             .populate("userId", "firstname lastname email photoURL")
//             .populate("jobId", "title company role")
//             .sort({ createdAt: -1 });
//         res.json(applications);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // PATCH /admin/applications/:id/verify
// adminRouter.patch("/applications/:id/verify", adminAuth, async (req, res) => {
//     try {

//         const application = await Application.findByIdAndUpdate(
//             req.params.id,
//             { status: "verified" },
//             { returnDocument: "after" }   // ✅ FIX
//         )
//         .populate("userId", "firstname lastname email")
//         .populate("jobId", "title company");

//         if (!application) {
//             return res.status(404).send("Application not found");
//         }

//         const transporter = nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//                 user: "pritpastagiya2006@gmail.com",
//                 pass: "aiizxilblnwswcer"
//             }
//         });

//         const mailOptions = {
//             from: "DevSwipe <pritpastagiya2006@gmail.com>",
//             to: application.userId.email,
//             subject: `Congratulations! You have been selected for ${application.jobId.title}`,
//             text: `
// Dear ${application.userId.firstname},

// Congratulations!

// Your application for the role of ${application.jobId.title} at ${application.jobId.company} has been verified by our admin.

// You may be contacted by the company soon.

// Best Regards,
// DevSwipe Team
// `
//         };

//         await transporter.sendMail(mailOptions);

//         res.json({
//             message: "Application verified and email sent",
//             application
//         });

//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // ─── PAYMENT MANAGEMENT ──────────────────────────────────────────────────────

// // GET /admin/payments - List all payments with user info, supports status filter & search
// adminRouter.get("/payments", adminAuth, async (req, res) => {
//     try {
//         const filter = {};
//         if (req.query.status) filter.status = req.query.status;
//         if (req.query.search) {
//             const regex = { $regex: req.query.search, $options: "i" };
//             filter.$or = [
//                 { orderId: regex },
//                 { paymentId: regex },
//                 { receipt: regex },
//                 { "notes.membershipType": regex }
//             ];
//         }
//         const payments = await Payment.find(filter)
//             .populate("userId", "firstname lastname email photoURL isPremium membershipType")
//             .sort({ createdAt: -1 });
//         const totalRevenue = await Payment.aggregate([
//             { $match: { status: "captured" } },
//             { $group: { _id: null, total: { $sum: "$amount" } } }
//         ]);
//         const statusCounts = await Payment.aggregate([
//             { $group: { _id: "$status", count: { $sum: 1 } } }
//         ]);
//         const membershipCounts = await Payment.aggregate([
//             { $group: { _id: "$notes.membershipType", count: { $sum: 1 }, revenue: { $sum: "$amount" } } }
//         ]);
//         res.json({
//             payments,
//             stats: {
//                 totalRevenue: totalRevenue[0]?.total || 0,
//                 statusCounts,
//                 membershipCounts
//             }
//         });
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // GET /admin/payments/:id - Get single payment detail
// adminRouter.get("/payments/:id", adminAuth, async (req, res) => {
//     try {
//         const payment = await Payment.findById(req.params.id)
//             .populate("userId", "firstname lastname email photoURL isPremium membershipType");
//         if (!payment) return res.status(404).send("Payment not found");
//         res.json(payment);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // PATCH /admin/payments/:id/status - Update payment status
// adminRouter.patch("/payments/:id/status", adminAuth, async (req, res) => {
//     try {
//         const { status } = req.body;
//         const allowed = ["created", "captured", "failed", "refunded"];
//         if (!allowed.includes(status)) {
//             return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}` });
//         }
//         const payment = await Payment.findByIdAndUpdate(
//             req.params.id,
//             { status },
//             { new: true }
//         ).populate("userId", "firstname lastname email photoURL");
//         if (!payment) return res.status(404).send("Payment not found");

//         // Sync user premium status when payment is captured or refunded
//         if (status === "captured") {
//             await User.findByIdAndUpdate(payment.userId._id, {
//                 isPremium: true,
//                 membershipType: payment.notes?.membershipType || "silver"
//             });
//         } else if (status === "refunded" || status === "failed") {
//             // Check if user has another captured payment before revoking
//             const otherCaptured = await Payment.findOne({
//                 userId: payment.userId._id,
//                 status: "captured",
//                 _id: { $ne: payment._id }
//             });
//             if (!otherCaptured) {
//                 await User.findByIdAndUpdate(payment.userId._id, {
//                     isPremium: false,
//                     membershipType: "free"
//                 });
//             }
//         }
//         res.json(payment);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // PATCH /admin/payments/:id/extend - Extend / upgrade membership type
// adminRouter.patch("/payments/:id/extend", adminAuth, async (req, res) => {
//     try {
//         const { membershipType, extendMonths } = req.body;
//         const payment = await Payment.findById(req.params.id).populate("userId", "firstname lastname email");
//         if (!payment) return res.status(404).send("Payment not found");

//         if (membershipType) {
//             payment.notes = { ...payment.notes, membershipType };
//             await payment.save();
//             // Update user membership too
//             await User.findByIdAndUpdate(payment.userId._id, { membershipType });
//         }

//         res.json({
//             message: `Membership ${ membershipType ? `updated to ${membershipType}` : "" }${ extendMonths ? ` extended by ${extendMonths} month(s)` : "" }`,
//             payment
//         });
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// // DELETE /admin/payments/:id - Delete a payment record
// adminRouter.delete("/payments/:id", adminAuth, async (req, res) => {
//     try {
//         const payment = await Payment.findByIdAndDelete(req.params.id);
//         if (!payment) return res.status(404).send("Payment not found");
//         res.json({ message: "Payment deleted successfully" });
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// module.exports = adminRouter;
