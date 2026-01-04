//mongodb+srv://pritpastagiya2006_db_user:a37FVziMbIF3DCri@cluster0.bkujjmd.mongodb.net/
const mongoose = require("mongoose");
const express = require('express');
const app = express();
const PORT = 3000;

const connectDB = async () => {
        await mongoose.connect(
            "mongodb+srv://pritpastagiya2006_db_user:a37FVziMbIF3DCri@cluster0.bkujjmd.mongodb.net/"
        );
    };
// connectDB()
// .then(() => {
//     console.log("Database connected successfully");
// })
// .catch((err) => {
//     console.error("Database connection error:", err);
// }); 

module.exports = connectDB; 