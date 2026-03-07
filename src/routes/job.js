const express = require("express");
const jobRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const Job = require("../models/job");
const Application = require("../models/application");

// GET /job - get all active jobs
jobRouter.get("/", userAuth, async (req, res) => {
    try {
        const { role, technology, company } = req.query;

      let query = {
    deadline: { $gte: new Date() },
    status: "active"
};
        if (role) {
            query.role = { $regex: role, $options: "i" };
        }

        if (technology) {
            query.skills = { $in: [new RegExp(technology, "i")] };
        }

        if (company) {
            query.company = { $regex: company, $options: "i" };
        }

        const jobs = await Job.find(query).sort({ createdAt: -1 });

        res.json(jobs);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET my applications
jobRouter.get("/applications/me", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;

        const applications = await Application.find({ userId })
            .populate("jobId")
            .sort({ createdAt: -1 });

        res.json(applications);

    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET specific job
jobRouter.get("/:id", userAuth, async (req, res) => {
    try {

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).send("Job not found");
        }

        res.json(job);

    } catch (err) {
        res.status(500).send(err.message);
    }
});

// APPLY JOB
jobRouter.post("/apply/:id", userAuth, async (req, res) => {
    try {

        const jobId = req.params.id;
        const userId = req.user._id;

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).send("Job not found");
        }

        if (new Date(job.deadline) < new Date() || job.status === "inactive") {
            return res.status(400).send("This job is no longer accepting applications");
        }

        const existingApplication = await Application.findOne({ jobId, userId });

        if (existingApplication) {
            return res.status(400).send("You have already applied for this job");
        }

        const application = new Application({
            jobId,
            userId,
            status: "applied"
        });

        await application.save();

        res.status(201).json({
            message: "Application submitted successfully",
            application
        });

    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = jobRouter;