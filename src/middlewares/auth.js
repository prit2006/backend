const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth=async (req, res, next) =>{

    try {
        const token = req.cookies.token;
        if (!token) {
           return res.status(401).send("Please Login!");
        }
        const decoded = await jwt.verify(token, "Prit@2006");
        const _id = decoded.userId;
        const user = await User.findById(_id);
        if (!user) {
            throw new Error("User not found.");
        }
        req.user = user;       
        next();
    } catch (err) {
        res.status(401).send("Authentication failed: " + err.message);
    }


}
module.exports={userAuth};