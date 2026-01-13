const express = require('express');
const userrouter = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validatesignupdata } = require('../util/validation');
const { userAuth } = require('../middlewares/auth');


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

userrouter.get("/feed",userAuth, async  (req, res) => {
    try {
        const users =await User.find();
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
        const allowedUpdates = ['firstname', 'lastname', 'email', 'age', 'gender','skills'];
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
// userrouter.patch("/skills", userAuth, async (req, res) => {
//   try {
//     const userId = req.user._id;
//     console.log(userId);
//     const { skills } = req.body;
//     console.log(skills);
//     if (!Array.isArray(skills)) {
//       return res.status(400).json({ message: "Skills must be an array" });
//     }
//     const user = await User.findById(userId);
//     console.log(user);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     user.skills = skills;
//     await user.save();
//     console.log(user.skills);
//     res.status(200).json({ message: "Skills updated successfully", skills: user.skills });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
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



module.exports = userrouter;

