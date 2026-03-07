const express = require('express');
const profilerouter = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { userAuth } = require('../middlewares/auth');
const { validatesignupdata , validateeditprofiledata , validatepasswordchange} = require('../util/validation');
const upload = require("../middlewares/upload");
const cloudinary = require("../config/cloudinary");


profilerouter.get("/", userAuth ,async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new Error("User not found");
        }
        res.send(user);

    } catch (err) {
        res.status(500).send("Error accessing profile: " + err.message);
    }
});

profilerouter.patch("/edit", userAuth, upload.single("photo"), async (req, res) => {
  try {

    const user = req.user;

    if (req.file) {

      const result = await new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
          { folder: "devswipe_profiles" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(req.file.buffer);

      });

      user.photoURL = result.secure_url;
    }

    if (req.body.firstname) user.firstname = req.body.firstname;
    if (req.body.lastname) user.lastname = req.body.lastname;
    if (req.body.age) user.age = req.body.age;
    if (req.body.gender) user.gender = req.body.gender;
    if (req.body.about) user.about = req.body.about;

    if (req.body.skills) {
      user.skills = JSON.parse(req.body.skills);
    }

    await user.save();

    res.send(user);

  } catch (err) {
    res.status(500).send("Error updating profile: " + err.message);
  }
});
 
profilerouter.delete("/delete", userAuth ,async (req, res) => {
    try {
        const user = req.user;
        await User.findByIdAndDelete(user._id);
        res.send("User profile deleted successfully");
    } catch (err) {
        res.status(500).send("Error deleting profile: " + err.message);
    }
});

profilerouter.patch("/edit/password", userAuth ,async (req, res) => {
    try {
        const Isupade = validatepasswordchange(req);
        if(!Isupade){
            throw new Error("Invalid data for update");
        }
        const user = req.user;
        const { oldpass, newpass } = req.body;
        const isMatch = await bcrypt.compare(oldpass, user.pass);
        if (!isMatch) {
            throw new Error("Old password is incorrect");
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newpass, saltRounds);
        user.pass = hashedPassword;
        await user.save();
        res.send(user);
    } catch (err) {
        res.status(500).send("Error updating password: " + err.message);
    }
});


module.exports = profilerouter;