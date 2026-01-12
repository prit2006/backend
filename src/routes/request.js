const express = require('express');
const requestrouter = express.Router();
const { userAuth } = require('../middlewares/auth'); 


requestrouter.post("/sendconnectionrequest", userAuth, async (req, res) => {
    const user = req.user;
    const sendconnectionrequestuser = user.firstname + " " + user.lastname;
    console.log("Connection request sent by:", sendconnectionrequestuser);
    res.send("Connection request sent");
});

module.exports = requestrouter;