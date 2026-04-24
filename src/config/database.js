const mongoose = require("mongoose");
const express = require('express');
const app = express();
const PORT = 3000;

const connectDB = async () => {
        await mongoose.connect(
            process.env.MONGODB_URI,
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