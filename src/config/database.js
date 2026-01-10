const mongoose = require("mongoose");
const express = require('express');
const app = express();
const PORT = 3000;

const connectDB = async () => {
        await mongoose.connect(
            "mongodb+srv://pritpastagiya2006_db_user:jGXj0FT0iVtQhbwB@cluster0.eg5pb3i.mongodb.net/DevSwipe_db",
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