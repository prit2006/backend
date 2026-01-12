const express = require('express');
const profilerouter = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { userAuth } = require('../middlewares/auth');



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

module.exports = profilerouter;