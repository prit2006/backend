const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
{
    title: { type: String, required: true },

    company: { type: String, required: true },

    role: { type: String, required: true },

    skills: { type: [String], default: [] },

    description: { type: String, required: true },

    eligibility: { type: String, required: true },

    deadline: { type: Date, required: true },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    }
},
{ timestamps: true }
);

jobSchema.index({ role: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ skills: 1 });

module.exports = mongoose.model("Job", jobSchema);