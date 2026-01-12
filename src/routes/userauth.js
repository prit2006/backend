const express = require('express');
const authrouter = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validatesignupdata } = require('../utilt/validation');



authrouter.post("/signup", async (req, res) => {
  try {
    //  Validate input
    validatesignupdata(req);

    //  Correctly get password
    const pass = req.body.pass;

    // Hash password
    const bcryptedPassword = await bcrypt.hash(pass, 10);
    //console.log("Encrypted Password:", bcryptedPassword);

    // Create user
    const user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      pass: bcryptedPassword,
      age: req.body.age,
      gender: req.body.gender
    });

    // Save to DB
    await user.save();

    res.status(201).send("User Signed Up Successfully");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

authrouter.post("/login", async (req, res) => {
    const { email, pass } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            throw new Error("User not found");
        }
        const isPasswordMatch = await user.validatePassword(pass);
        if (!isPasswordMatch) {
            throw new Error("Incorrect password");
        }
        // res.send("Login successful");
        // create a jwt token here for better security

        const token = user.getJwtToken();
        // console.log("Generated JWT Token:", token);
        res.cookie("token",token, { httpOnly: true });
        const Loginuser = await User.findOne({ email: email });
        // console.log(Loginuser);
        res.send(Loginuser);
    } catch (err) {
        res.status(500).send("Error logging in: " + err.message);
    }
});

module.exports = authrouter;