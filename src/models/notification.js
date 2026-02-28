const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ["CONNECTION_REQUEST", "REQUEST_ACCEPTED", "POST_LIKE", "POST_COMMENT"],
        message: "{VALUE} is not a valid notification type",
      },
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      // Optional: to link to a specific post if it's a POST_LIKE or POST_COMMENT
      type: mongoose.Schema.Types.ObjectId,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
