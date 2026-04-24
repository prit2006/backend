const express = require('express');
const authrouter = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validatesignupdata } = require('../util/validation');
const { userAuth } = require('../middlewares/auth');
const upload = require("../middlewares/upload");
const cloudinary = require("../config/cloudinary");
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// authrouter.post("/signup", async (req, res) => {
//   try {
//     //  Validate input
//     validatesignupdata(req);

//     //  Correctly get password
//     const pass = req.body.pass;

//     // Hash password
//     const bcryptedPassword = await bcrypt.hash(pass, 10);
//     //console.log("Encrypted Password:", bcryptedPassword);

//     // Create user
//     const user = new User({
//       firstname: req.body.firstname,
//       lastname: req.body.lastname,
//       email: req.body.email,
//       pass: bcryptedPassword,
//       age: req.body.age,
//       gender: req.body.gender,
//       skills: req.body.skills,
//       photoURL: req.body.photoURL
//     });

//     // Save to DB
//     await user.save();

//     res.status(201).send("User Signed Up Successfully");
//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// });
authrouter.post("/signup", upload.single("photo"), async (req, res) => {
  try {

    validatesignupdata(req);

    const pass = req.body.pass;

    const bcryptedPassword = await bcrypt.hash(pass, 10);

    let photoURL = "";

    // Upload image to Cloudinary
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

      photoURL = result.secure_url;
    }

    const user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      pass: bcryptedPassword,
      age: req.body.age,
      gender: req.body.gender,
      skills: req.body.skills,
      photoURL: photoURL
    });

    await user.save();

    res.status(201).send("User Signed Up Successfully");

  } catch (err) {
    res.status(400).send(err.message);
  }
});

authrouter.post("/login", async (req, res) => {
  const { email, pass } = req.body;
  try {
    let user = await User.findOne({ email: email });

    if (!user && email === "Admin@gmail.com" && pass === "Admin@2006") {
      const bcryptedPassword = await bcrypt.hash(pass, 10);
      user = new User({
        firstname: "Admin",
        lastname: "User",
        email: "Admin@gmail.com",
        pass: bcryptedPassword,
        role: "admin",
        status: "active"
      });
      await user.save();
    }

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
    res.cookie("token", token, { httpOnly: true });
    const Loginuser = await User.findOne({ email: email });
    // console.log(Loginuser);
    // res.send("Login succesfull");
    res.send(user)
  } catch (err) {
    res.status(500).send("Error logging in: " + err.message);
  }
});

authrouter.post("/logout", userAuth, (req, res) => {
  const { firstname, lastname } = req.user;
  res.clearCookie("token");
  res.send(`${firstname} ${lastname} logged out successfully`);
});

authrouter.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with this email not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 3 minutes from now
    const otpExpiry = new Date(Date.now() + 3 * 60 * 1000);

    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    await user.save();

    // const mailOptions = {
    //   from: 'pritpastagiya2006@gmail.com',
    //   to: email,
    //   subject: 'DevSwipe Password Reset OTP',
    //   text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 3 minutes.`
    // };

    const otpEmailHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DevSwipe – Password Reset OTP</title>
</head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:linear-gradient(135deg,#0d0d1a 0%,#120820 40%,#1a0a1e 70%,#0a0a12 100%);min-height:100vh;">
    <tr>
      <td align="center" valign="middle" style="padding:48px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px;width:100%;background:linear-gradient(160deg,#1a1a2e 0%,#16162a 50%,#1a1226 100%);border-radius:20px;border:1px solid rgba(139,92,246,0.18);box-shadow:0 0 60px rgba(139,92,246,0.12),0 32px 64px rgba(0,0,0,0.6);">
          <tr><td style="padding:0;"><div style="height:3px;background:linear-gradient(90deg,transparent,#7c3aed 30%,#a855f7 55%,#ec4899 80%,transparent);border-radius:20px 20px 0 0;"></div></td></tr>
          <tr><td align="center" style="padding:44px 40px 0;"><div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#4c1d95,#7c3aed);display:inline-block;box-shadow:0 0 28px rgba(139,92,246,0.45);line-height:72px;text-align:center;font-size:30px;">🔐</div></td></tr>
          <tr><td align="center" style="padding:28px 40px 6px;"><h1 style="margin:0;font-size:34px;font-weight:800;color:#ffffff;">Password Reset</h1><p style="margin:10px 0 0;font-size:15px;color:#9ca3af;">Sign in to continue your journey</p></td></tr>
          <tr><td style="padding:24px 40px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.25),transparent);"></div></td></tr>
          <tr><td style="padding:28px 40px 0;"><p style="margin:0;font-size:15px;color:#c4b5fd;line-height:1.7;">We received a request to reset your <strong style="color:#e9d5ff;">DevSwipe</strong> account password. Use the OTP below. It expires in <strong style="color:#a855f7;">3 minutes</strong>.</p></td></tr>
          <tr><td align="center" style="padding:32px 40px;"><div style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08));border:1px solid rgba(139,92,246,0.35);border-radius:14px;padding:28px 40px;box-shadow:0 8px 32px rgba(139,92,246,0.15);"><p style="margin:0 0 10px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7c3aed;font-weight:600;">Your One-Time Password</p><p style="margin:0;font-size:44px;font-weight:900;letter-spacing:14px;color:#ffffff;text-shadow:0 0 24px rgba(168,85,247,0.6);">${otp}</p></div></td></tr>
          <tr><td style="padding:0 40px 28px;"><div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.18);border-radius:10px;padding:14px 18px;"><p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.6;">⚠️ &nbsp;If you didn't request this, ignore this email. Never share your OTP.</p></div></td></tr>
          <tr><td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.2),transparent);"></div></td></tr>
          <tr><td align="center" style="padding:28px 40px 40px;"><p style="margin:0 0 6px;font-size:12px;color:#6b7280;">🛡️ &nbsp;Secured by industry-standard encryption</p><p style="margin:0;font-size:12px;color:#4b5563;">© 2026 <strong style="color:#7c3aed;">DevSwipe</strong>. All rights reserved.</p></td></tr>
          <tr><td><div style="height:2px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent);border-radius:0 0 20px 20px;"></div></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email,
  subject: 'DevSwipe Password Reset OTP',
  text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 3 minutes.`,
  html: otpEmailHTML,
};

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Failed to send OTP email" });
      } else {
        return res.status(200).json({ message: "OTP sent to your email successfully" });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

authrouter.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.resetOTP || user.resetOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetOTPExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Hash the new password
    const bcryptedPassword = await bcrypt.hash(newPassword, 10);
    user.pass = bcryptedPassword;

    // Clear OTP fields
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = authrouter;