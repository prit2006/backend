const express = require("express");
const postRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const Post = require("../models/post");
const ConnectionRequest = require("../models/connectionrequest");

/* ---------------- CREATE POST ---------------- */
postRouter.post("/create", userAuth, async (req, res) => {
  try {
    const { title, content, imgURL } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const post = new Post({
      userId: req.user._id,
      title,
      content,
      imgURL
    });

    await post.save();
    res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- FEED (NON PAGINATED) ---------------- */
postRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const acceptedConnections = await ConnectionRequest.find({
      status: "accepted",
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }]
    });

    const connectedUserIds = acceptedConnections.map((c) =>
      c.senderId.equals(loggedInUserId) ? c.receiverId : c.senderId
    );

    connectedUserIds.push(loggedInUserId);

    const posts = await Post.find({ userId: { $in: connectedUserIds } })
      .sort({ createdAt: -1 })
      .populate("userId", "firstname lastname photoURL")
      .populate("comments.userId", "firstname lastname photoURL");

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- LIKE / UNLIKE ---------------- */
postRouter.patch("/like/:postId", userAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isLiked = post.likes.includes(userId);

    await Post.findByIdAndUpdate(
      postId,
      isLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } }
    );

    res.json({ message: isLiked ? "Post unliked" : "Post liked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- ADD COMMENT ---------------- */
postRouter.post("/comment/:postId", userAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $push: { comments: { userId: req.user._id, text } } },
      { new: true }
    ).populate("comments.userId", "firstname lastname photoURL");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(201).json({ message: "Comment added", comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- EDIT COMMENT ---------------- */
postRouter.patch("/comment/:postId/:commentId", userAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.text = text;
    await post.save();

    const updatedPost = await Post.findById(req.params.postId)
      .populate("comments.userId", "firstname lastname photoURL");

    res.json({
      message: "Comment updated successfully",
      comments: updatedPost.comments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- DELETE COMMENT ---------------- */
postRouter.delete("/comment/:postId/:commentId", userAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isOwner =
      comment.userId.toString() === req.user._id.toString() ||
      post.userId.toString() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.deleteOne();
    await post.save();

    const updatedPost = await Post.findById(req.params.postId)
      .populate("comments.userId", "firstname lastname photoURL");

    res.json({
      message: "Comment deleted successfully",
      comments: updatedPost.comments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- PAGINATED FEED ---------------- */
postRouter.get("/feeds", userAuth, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const connections = await ConnectionRequest.find({
      status: "accepted",
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
    });

    const ids = connections.map((c) =>
      c.senderId.equals(req.user._id) ? c.receiverId : c.senderId
    );
    ids.push(req.user._id);

    const posts = await Post.find({ userId: { $in: ids } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstname lastname photoURL")
      .populate("comments.userId", "firstname lastname photoURL");

    res.json({ page, limit, count: posts.length, posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- SINGLE POST ---------------- */
postRouter.get("/:postId", userAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("userId", "firstname lastname photoURL")
      .populate("comments.userId", "firstname lastname photoURL");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- MY POSTS ---------------- */
postRouter.get("/my/posts", userAuth, async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("userId", "firstname lastname photoURL")
      .populate("comments.userId", "firstname lastname photoURL");

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = postRouter;



// const express = require("express");
// const postRouter = express.Router();
// const { userAuth } = require("../middlewares/auth");
// const Post = require("../models/post");
// const ConnectionRequest = require("../models/connectionrequest");

// postRouter.post("/create", userAuth, async (req, res) => {
//   try {
//     const { title, content, imgURL } = req.body;

//     if (!title) {
//       return res.status(400).json({ message: "Title is required" });
//     }

//     const post = new Post({
//       userId: req.user._id,
//       title,
//       content,
//       imgURL
//     });

//     await post.save();

//     res.status(201).json({
//       message: "Post created successfully",
//       post
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// postRouter.get("/feed", userAuth, async (req, res) => {
//   try {
//     const loggedInUserId = req.user._id;

//     // 1️⃣ Find all ACCEPTED connections
//     const acceptedConnections = await ConnectionRequest.find({
//       status: "accepted",
//       $or: [
//         { senderId: loggedInUserId },
//         { receiverId: loggedInUserId }
//       ]
//     });

//     // 2️⃣ Extract connected user IDs
//     const connectedUserIds = acceptedConnections.map((conn) => {
//       return conn.senderId.equals(loggedInUserId)
//         ? conn.receiverId
//         : conn.senderId;
//     });

//     // 3️⃣ Include own posts
//     connectedUserIds.push(loggedInUserId);

//     // 4️⃣ Fetch posts of accepted users + self
//     const posts = await Post.find({
//       userId: { $in: connectedUserIds }
//     })
//       .populate("userId", "firstname lastname photoURL")
//       .populate("comments.userId", "firstname lastname")
//       .sort({ createdAt: -1 });

//     res.status(200).json(posts);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// postRouter.patch("/like/:postId", userAuth, async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user._id;

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const isLiked = post.likes.includes(userId);

//     if (isLiked) {
//       // UNLIKE
//       await Post.findByIdAndUpdate(
//         postId,
//         { $pull: { likes: userId } },
//         { new: true }
//       );
//       return res.json({ message: "Post unliked" });
//     } else {
//       // LIKE
//       await Post.findByIdAndUpdate(
//         postId,
//         { $addToSet: { likes: userId } }, // atomic + no duplicates
//         { new: true }
//       );
//       return res.json({ message: "Post liked" });
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// postRouter.post("/comment/:postId", userAuth, async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { text } = req.body;

//     if (!text || !text.trim()) {
//       return res.status(400).json({ message: "Comment text is required" });
//     }

//     const post = await Post.findByIdAndUpdate(
//       postId,
//       {
//         $push: {
//           comments: {
//             userId: req.user._id,
//             text
//           }
//         }
//       },
//       { new: true }
//     )
//       .populate("comments.userId", "firstname lastname");

//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     res.status(201).json({
//       message: "Comment added",
//       comments: post.comments
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// postRouter.patch("/edit/:postId", userAuth, async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { title, content, imgURL } = req.body;

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // 🔐 Ownership check
//     if (post.userId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized to edit this post" });
//     }

//     // Update only provided fields
//     if (title) post.title = title;
//     if (content) post.content = content;
//     if (imgURL) post.imgURL = imgURL;

//     await post.save();

//     res.json({
//       message: "Post updated successfully",
//       post
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// postRouter.delete("/delete/:postId", userAuth, async (req, res) => {
//   try {
//     const { postId } = req.params;

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // 🔐 Ownership check
//     if (post.userId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized to delete this post" });
//     }

//     await Post.findByIdAndDelete(postId);

//     res.json({ message: "Post deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// postRouter.get("/feeds", userAuth, async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const connections = await ConnectionRequest.find({
//       status: "accepted",
//       $or: [{ senderId: userId }, { receiverId: userId }]
//     });

//     const connectedUserIds = connections.map((c) =>
//       c.senderId.equals(userId) ? c.receiverId : c.senderId
//     );

//     connectedUserIds.push(userId); // include own posts

//     const posts = await Post.find({ userId: { $in: connectedUserIds } })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate("userId", "firstname lastname photoURL")
//       .populate("comments.userId", "firstname lastname");

//     res.json({
//       page,
//       limit,
//       count: posts.length,
//       posts
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// postRouter.get("/:postId", userAuth, async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user._id;

//     const post = await Post.findById(postId)
//       .populate("userId", "firstname lastname photoURL")
//       .populate("comments.userId", "firstname lastname");

//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // Owner can always see
//     if (post.userId._id.equals(userId)) {
//       return res.json(post);
//     }

//     // Check accepted connection
//     const isAccepted = await ConnectionRequest.findOne({
//       status: "accepted",
//       $or: [
//         { senderId: userId, receiverId: post.userId._id },
//         { senderId: post.userId._id, receiverId: userId }
//       ]
//     });

//     if (!isAccepted) {
//       return res.status(403).json({ message: "Not authorized to view this post" });
//     }

//     res.json(post);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// postRouter.get("/my/posts", userAuth, async (req, res) => {
//   try {
//     const posts = await Post.find({ userId: req.user._id })
//       .sort({ createdAt: -1 })
//       .populate("userId", "firstname lastname photoURL");

//     res.json(posts);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
// postRouter.delete("/comment/:postId/:commentId", userAuth, async (req, res) => {
//   try {
//     const { postId, commentId } = req.params;
//     const loggedInUserId = req.user._id;

//     // 1️⃣ Find post
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // 2️⃣ Find comment
//     const comment = post.comments.id(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: "Comment not found" });
//     }

//     // 3️⃣ Authorization checks
//     const isCommentOwner =
//       comment.userId.toString() === loggedInUserId.toString();

//     const isPostOwner =
//       post.userId.toString() === loggedInUserId.toString();

//     if (!isCommentOwner && !isPostOwner) {
//       return res.status(403).json({
//         message: "Not authorized to delete this comment"
//       });
//     }

//     // ✅ 4️⃣ DELETE COMMENT (Mongoose v7 safe)
//     comment.deleteOne();
//     await post.save();
    
// const updatedPost = await Post.findById(postId)
//   .populate("comments.userId", "firstname lastname photoURL");

//    res.json({
//   message: "Comment deleted successfully",
//   comments: updatedPost.comments
// });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

//  postRouter.patch("/comment/:postId/:commentId", userAuth, async (req, res) => {
//   try {
//     const { postId, commentId } = req.params;
//     const { text } = req.body;
//     const loggedInUserId = req.user._id;

//     if (!text || !text.trim()) {
//       return res.status(400).json({ message: "Comment text is required" });
//     }

//     // 1️⃣ Find post
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // 2️⃣ Find comment
//     const comment = post.comments.id(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: "Comment not found" });
//     }

//     // 3️⃣ Only comment owner can edit
//     if (comment.userId.toString() !== loggedInUserId.toString()) {
//       return res.status(403).json({
//         message: "Not authorized to edit this comment"
//       });
//     }

//     // 4️⃣ Update comment
//     comment.text = text;
//     await post.save();

// const updatedPost = await Post.findById(postId)
//   .populate("comments.userId", "firstname lastname photoURL");

// res.json({
//   message: "Comment updated successfully",
//   comments: updatedPost.comments
// });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });



// module.exports = postRouter;
