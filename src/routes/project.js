const express = require("express");
const Project = require("../models/project");
const { userAuth } = require("../middlewares/auth");
const { isConnected } = require("../util/checkConnection");
const mongoose = require("mongoose");
const { validatesignupdata } = require("../util/validation");

const projectRouter = express.Router();
const ConnectionRequest = require("../models/connectionrequest");


/**
 * CREATE PROJECT
 * Only allowed if requester is connected (accepted) with himself (always true)
 */
projectRouter.post("/create", userAuth, async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      ownerId: req.user._id,
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET MY PROJECTS
 */
projectRouter.get("/my", userAuth, async (req, res) => {
  const projects = await Project.find({ ownerId: req.user._id });
  res.json(projects);
});

/**
 * GET USER PROJECTS (only if connected)
 */
projectRouter.get("/user/:userId", userAuth, async (req, res) => {
  const targetUserId = req.params.userId;

  const allowed = await isConnected(req.user._id, targetUserId);
  if (!allowed) {
    return res.status(403).json({ message: "Connection not accepted" });
  }

  const projects = await Project.find({
    ownerId: targetUserId,
    isPublic: true,
  });

  res.json(projects);
});

/**
 * DELETE PROJECT (owner only)
 */
projectRouter.delete("/:projectId", userAuth, async (req, res) => {
  const project = await Project.findOneAndDelete({
    _id: req.params.projectId,
    ownerId: req.user._id,
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  res.json({ message: "Project deleted successfully" });
});

/**
 * UPDATE PROJECT (owner only)
 */
projectRouter.patch("/:projectId", userAuth, async (req, res) => {
  try {
    const allowedUpdates = [
      "header",
      "description",
      "githubURL",
      "deployURL",
      "websiteImages",
      "techStack",
      "isPublic",
    ];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates" });
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, ownerId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project updated successfully", project });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET SINGLE PROJECT (owner or connected user)
 */
projectRouter.get("/:projectId", userAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate("ownerId", "firstname lastname")


    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Owner can always view
    if (project.ownerId._id.toString() === req.user._id.toString()) {
      return res.json(project);
    }

    // Others: must be connected + public
    const allowed = await isConnected(req.user._id, project.ownerId._id);
    if (!allowed || !project.isPublic) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// projectRouter.get("/:projectId", userAuth, async (req, res) => {
//   try {
//     const project = await Project.findById(req.params.projectId).populate(
//       "ownerId",
//       "firstName lastName"
//     );

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     // Check if requester is owner
//     if (project.ownerId._id.toString() === req.user._id.toString()) {
//       return res.json(project);
//     }

//     // Check if connected and project is public
//     const allowed = await isConnected(req.user._id, project.ownerId._id);
//     if (!allowed || !project.isPublic) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     res.json(project);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

/**
 * GET ALL PUBLIC PROJECTS FROM CONNECTED USERS
 */
projectRouter.get("/feed/all", userAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const connections = await ConnectionRequest.find({
      status: "accepted",
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id },
      ],
    });

    const connectedUserIds = connections.map((conn) =>
      conn.senderId.toString() === req.user._id.toString()
        ? conn.receiverId
        : conn.senderId
    );

    if (connectedUserIds.length === 0) {
      return res.json({
        projects: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalProjects: 0,
        },
      });
    }

    const projects = await Project.find({
      ownerId: { $in: connectedUserIds },
      isPublic: true,
    })
      .populate("ownerId", "firstname lastname") // ✅ FIX HERE
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments({
      ownerId: { $in: connectedUserIds },
      isPublic: true,
    });

    res.json({
      projects,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProjects: total,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// projectRouter.get("/feed/all", userAuth, async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     // Get accepted connections
//     const connections = await ConnectionRequest.find({
//       status: "accepted",
//       $or: [
//         { senderId: req.user._id },
//         { receiverId: req.user._id },
//       ],
//     });

//     // Extract connected user IDs
//     const connectedUserIds = connections.map((conn) =>
//       conn.senderId.toString() === req.user._id.toString()
//         ? conn.receiverId
//         : conn.senderId
//     );

//     if (connectedUserIds.length === 0) {
//       return res.json({
//         projects: [],
//         pagination: {
//           currentPage: page,
//           totalPages: 0,
//           totalProjects: 0,
//         },
//       });
//     }

//     const projects = await Project.find({
//       ownerId: { $in: connectedUserIds },
//       isPublic: true,
//     })
//       .populate("ownerId", "firstName lastName")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const total = await Project.countDocuments({
//       ownerId: { $in: connectedUserIds },
//       isPublic: true,
//     });

//     res.json({
//       projects,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalProjects: total,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// projectRouter.get("/feed/all", userAuth, async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const connections = await ConnectionRequest.find({
//       status: "accepted",
//       $or: [
//         { senderId: req.user._id },
//         { receiverId: req.user._id },
//       ],
//     });

//     const connectedUserIds = connections.map((conn) =>
//       conn.senderId.toString() === req.user._id.toString()
//         ? conn.receiverId
//         : conn.senderId
//     );

//     if (connectedUserIds.length === 0) {
//       return res.json({
//         projects: [],
//         pagination: {
//           currentPage: page,
//           totalPages: 0,
//           totalProjects: 0,
//         },
//       });
//     }

//     const projects = await Project.find({
//       ownerId: { $in: connectedUserIds },
//       isPublic: true,
//     })
//       .populate("ownerId", "firstName lastName")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const total = await Project.countDocuments({
//       ownerId: { $in: connectedUserIds },
//       isPublic: true,
//     });

//     res.json({
//       projects,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalProjects: total,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// projectRouter.get("/feed/all", userAuth, async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     // Get all accepted connections
//     const connections = await ConnectionRequest.find({
//       $or: [
//         { fromUserId: req.user._id, status: "accepted" },
//         { toUserId: req.user._id, status: "accepted" },
//       ],
//     });

//     // Extract connected user IDs
//     const connectedUserIds = connections.map((conn) =>
//       conn.fromUserId.toString() === req.user._id.toString()
//         ? conn.toUserId
//         : conn.fromUserId
//     );

//     // Get public projects from connected users
//     const projects = await Project.find({
//       ownerId: { $in: connectedUserIds },
//       isPublic: true,
//     })
//       .populate("ownerId", "firstName lastName")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const total = await Project.countDocuments({
//       ownerId: { $in: connectedUserIds },
//       isPublic: true,
//     });

//     res.json({
//       projects,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalProjects: total,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

/**
 * TOGGLE PROJECT VISIBILITY (owner only)
 */
projectRouter.patch("/:projectId/toggle-visibility", userAuth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      ownerId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.isPublic = !project.isPublic;
    await project.save();

    res.json({
      message: `Project is now ${project.isPublic ? "public" : "private"}`,
      project,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * SEARCH PROJECTS BY TECH STACK (among connected users)
 */

projectRouter.get("/search/tech", userAuth, async (req, res) => {
  try {
    const { tech } = req.query;

    if (!tech) {
      return res.status(400).json({ message: "Tech stack query required" });
    }

    const connections = await ConnectionRequest.find({
      status: "accepted",
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id },
      ],
    });

    const connectedUserIds = connections.map((conn) =>
      conn.senderId.toString() === req.user._id.toString()
        ? conn.receiverId
        : conn.senderId
    );

    // include own projects
    connectedUserIds.push(req.user._id);

    const projects = await Project.find({
      ownerId: { $in: connectedUserIds },
      isPublic: true,
      techStack: { $regex: tech, $options: "i" },
    }).populate("ownerId", "firstname lastname")


    res.json(projects);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// projectRouter.get("/search/tech", userAuth, async (req, res) => {
//   try {
//     const { tech } = req.query;

//     if (!tech) {
//       return res.status(400).json({ message: "Tech stack query required" });
//     }

//     const connections = await ConnectionRequest.find({
//       status: "accepted",
//       $or: [
//         { senderId: req.user._id },
//         { receiverId: req.user._id },
//       ],
//     });

//     const connectedUserIds = connections.map((conn) =>
//       conn.senderId.toString() === req.user._id.toString()
//         ? conn.receiverId
//         : conn.senderId
//     );

//     connectedUserIds.push(req.user._id);

//     const projects = await Project.find({
//       ownerId: { $in: connectedUserIds },
//       isPublic: true,
//       techStack: { $regex: tech, $options: "i" },
//     }).populate("ownerId", "firstName lastName");

//     res.json(projects);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// projectRouter.get("/search/tech", userAuth, async (req, res) => {
//   try {
//     const { tech } = req.query;

//     if (!tech) {
//       return res.status(400).json({ message: "Tech stack query required" });
//     }

//     // Get connected user IDs
//     const connections = await ConnectionRequest.find({
//       $or: [
//         { fromUserId: req.user._id, status: "accepted" },
//         { toUserId: req.user._id, status: "accepted" },
//       ],
//     });

//     const connectedUserIds = connections.map((conn) =>
//       conn.fromUserId.toString() === req.user._id.toString()
//         ? conn.toUserId
//         : conn.fromUserId
//     );

//     // Add own ID to search own projects too
//     connectedUserIds.push(req.user._id);

//     const projects = await Project.find({
//       ownerId: { $in: connectedUserIds },
//       isPublic: true,
//       techStack: { $regex: tech, $options: "i" },
//     }).populate("ownerId", "firstName lastName");

//     res.json(projects);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

/**
 * ADD IMAGE TO PROJECT (owner only)
 */
projectRouter.post("/:projectId/images", userAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL required" });
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, ownerId: req.user._id },
      { $push: { websiteImages: imageUrl } },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Image added successfully", project });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * REMOVE IMAGE FROM PROJECT (owner only)
 */
projectRouter.delete("/:projectId/images", userAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL required" });
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, ownerId: req.user._id },
      { $pull: { websiteImages: imageUrl } },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Image removed successfully", project });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET PROJECT STATISTICS (owner only)
 */
projectRouter.get("/stats/my", userAuth, async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments({
      ownerId: req.user._id,
    });
    
    const publicProjects = await Project.countDocuments({
      ownerId: req.user._id,
      isPublic: true,
    });

    const techStackStats = await Project.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(req.user._id) } },
      { $unwind: "$techStack" },
      { $group: { _id: "$techStack", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalProjects,
      publicProjects,
      privateProjects: totalProjects - publicProjects,
      techStackStats,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = projectRouter;
