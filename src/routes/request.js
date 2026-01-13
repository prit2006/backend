const express = require('express');
const requestrouter = express.Router();
const { userAuth } = require('../middlewares/auth'); 
const ConnectionRequest = require('../models/connectionrequest');
const User = require('../models/user');

requestrouter.post("/send/:status/:receiveruserId", userAuth, async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.receiveruserId;
    const status = req.params.status;
    
    //this will be checked by the pre save hook in model
    // if (senderId.toString() === receiverId) {
    //   return res.status(400).json({ message: "You cannot send a request to yourself" });
    // }
    
    const senderuser = await User.findById(senderId);
    const receiveruser = await User.findById(receiverId);

    if (!senderuser || !receiveruser) {
      return res.status(404).json({ message: "User not found" });
    }

    const allowedstatus = ["interested", "ignored"];
    if (!allowedstatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existingRequest) {
        if(existingRequest.status==="interested"){
      return res.status(400).json({
        message: `Connection already exists between ${senderuser.firstname} ${senderuser.lastname} and ${receiveruser.firstname} ${receiveruser.lastname}`
      });
    } else{
      return res.status(400).json({
        message: `You have already ignored ${receiveruser.firstname} ${receiveruser.lastname}`
    });
    }
}

    const connectionRequest = new ConnectionRequest({
      senderId,
      receiverId,
      status
    });

    const data = await connectionRequest.save();
    if(status==="interested"){
    res.status(201).json({
      message: `${senderuser.firstname} ${senderuser.lastname} sent request to ${receiveruser.firstname} ${receiveruser.lastname}`,
      data
    });
    }else{
    res.status(201).json({
      message: `${senderuser.firstname} ${senderuser.lastname} ignored ${receiveruser.firstname} ${receiveruser.lastname}`,
      data
    });
}

  } catch (err) {
    res.status(500).json({
      message: "Error sending interest",
      error: err.message
    });
  }
});


module.exports = requestrouter;