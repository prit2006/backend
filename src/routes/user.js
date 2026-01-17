const express = require('express');
const userrouter = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validatesignupdata } = require('../util/validation');
const { userAuth } = require('../middlewares/auth');
const mongoose = require('mongoose');
const ConnectionRequest = require('../models/connectionrequest');


userrouter.get("/",userAuth, async (req, res) => {
    // const email = req.body.email;
    // console.log(email);
     const user = req.user;
    try{
        // console.log(user);
        if (!user) {
            return res.status(404).send("User not found");
        }else{
        res.send(user);
        }
    } catch (err) {
        res.status(500).send("User not found");
    }
});

userrouter.get("/getall",userAuth, async  (req, res) => {
    try {
        //me not include myself in the list
        const users = await User.find({ _id: { $ne: req.user._id } });
        if (users.length === 0) {
            return res.status(404).send("No users found");
        }   else{
            // console.log(users);
            res.send(users);
        }
    
    } catch (err) {
        res.status(500).send("Error fetching users: " + err.message);
    }       
});

userrouter.delete("/",userAuth, async (req, res) => {
    const email = req.body.email;   
    try {
        const deletedUser = await User.findOneAndDelete({ email: email });
        if (!deletedUser) {
            return res.status(404).send("User not found");
        }  else{
            res.send(deletedUser);
            res.send("User deleted successfully");
        }
    } catch (err) {
        res.status(500).send("Error deleting user: " + err.message);
    }       
});

userrouter.delete("/:userId",userAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check ID present
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userId);

    // Check existence
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Success
    return res.status(200).json({
      message: "User deleted successfully",
      deletedUser
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

userrouter.patch("/:userId",userAuth, async (req, res) => {
    const userId = req.params?.userId;
    console.log(userId);
    const updateduser = req.body;
    console.log(updateduser);
    try {
        const allowedUpdates = ['firstname', 'lastname', 'email', 'age', 'gender','skills','photoURL'];
        const updates = Object.keys(updateduser);
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) {
          throw new Error('Invalid updates!');
        }
        const updatedUser = await User.findByIdAndUpdate({_id : userId} , updateduser, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).send("User not found");
        }   else{
            res.send("User updated successfully");
        }
    } catch (err) {
        res.status(500).send("Error updating user: " + err.message);
    }
});

userrouter.post("/skills", userAuth, async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: "Skills must be an array" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,   
      {
        $addToSet: {
          skills: { $each: skills }
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Skills updated successfully",
      skills: user.skills
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

userrouter.delete("/skills/:userId", userAuth, async (req, res) => {
  try {
    const userId = req.params?.userId;
    const { skills } = req.body;
    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: "Skills must be an array" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          skills: { $in: skills }
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Skills removed successfully",
      skills: user.skills
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

userrouter.get("/requests/received",userAuth,async (req,res)=>
{
    try{
    const userId = req.user._id;
    const requests = await ConnectionRequest.find({ receiverId: userId ,status: "interested"}).populate('senderId', 'firstname lastname email age gender skills');
    if(requests.length===0){
        res.status(404).json({ message: "No requests found" }); 
    }
    res.json(requests);
    }catch(err)
    {
        res.status(500).json({ error: err.message });
    }

});

userrouter.get("/connection",userAuth,async (req,res)=>
{
    try{
    const userId = req.user._id;
    const requests = await ConnectionRequest.find(
        { $or: [
            { senderId: userId, status: "accepted" },
            { receiverId: userId, status: "accepted" }
        ]
    }).populate('senderId receiverId', 'firstname lastname email age gender skills');
    if(requests.length===0){
        res.status(404).json({ message: "No accepted requests found" });
    }
    const data = requests.map(request => {
        return {
            connectionWith: request.senderId._id.equals(userId) ? request.receiverId : request.senderId,
            connectedAt: request.updatedAt
        };
    });
    res.json(data);
    }catch(err)
    {
        res.status(500).json({ error: err.message });
    }

});
userrouter.get("/feed",userAuth, async  (req, res) => {
    try {
     //   user dont want to see themselves in feed and also those who are ignored or rejected by them
        // const allUsers =await User.find({_id: { $ne: req.user._id } });
        // if (allUsers.length === 0) {
        //     return res.status(404).send("No users found");
        // } 
        // const ignoredOrRejectedIds = await ConnectionRequest.find({ 
        //     senderId: req.user._id, 
        //     status: { $in: ["ignored", "rejected", "accepted", "interested"] } 
        // }).distinct('receiverId');
        // const users = await User.find({
        //     _id: { $nin: [req.user._id, ...ignoredOrRejectedIds] }
        // });
        // res.json({ users });

        const receiveruserId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        if (limit > 100) limit = 100; // Max limit to 100
        const skip = (page - 1) * limit;
        
        const connectionRequest = await ConnectionRequest.find({
            $or: [
                { senderId: receiveruserId },
                { receiverId: receiveruserId }
            ]
        }).select('senderId receiverId status').populate('senderId receiverId', 'firstname lastname ');
       
        const hideuserfromfeed = new Set();
        connectionRequest.forEach(request => {
            hideuserfromfeed.add(request.senderId._id.toString());
            hideuserfromfeed.add(request.receiverId._id.toString());
        });
        hideuserfromfeed.add(receiveruserId.toString());
        console.log(hideuserfromfeed);

       // users = await User.find({   _id: { $nin: Array.from(hideuserfromfeed) } });
       const users = await User.find({ $and: [ { _id: { $ne: receiveruserId } }, 
        { _id: { $nin: Array.from(hideuserfromfeed) } } ] }).skip(skip).limit(limit);
        if(users.length === 0) {
            return res.status(404).send("No users found for feed");
        }
        hideuserfromfeed.clear();
        res.json(users);
    } catch (err) {
        res.status(500).send("Error fetching users: " + err.message);
    }
});
module.exports = userrouter;

