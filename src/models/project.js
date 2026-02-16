const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    header: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    githubURL: {
      type: String,
      required: true,
    },

    deployURL: {
      type: String,
    },

    websiteImages: {
      type: [String], // image URLs
      default: [],
    },

    techStack: {
      type: [String],
      default: [],
    },

    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model("Project", projectSchema);
