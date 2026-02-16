const ConnectionRequest = require("../models/connectionrequest");

const isConnected = async (userId, targetUserId) => {
  const connection = await ConnectionRequest.findOne({
    $or: [
      { senderId: userId, receiverId: targetUserId },
      { senderId: targetUserId, receiverId: userId },
    ],
    status: "accepted",
  });

  return !!connection;
};

module.exports = { isConnected };

