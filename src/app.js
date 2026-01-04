const express = require("express")
const app = express();
const port = 3000;
const connectDB = require("./config/database")
const {adminAuth,userAuth} = require("./middlewares/auth")
const User = require("./models/user")

// app.use("/",(err, req, res, next) => {
//   console.error(err.stack); 
//   res.status(500).send('Something went wrong!');
// });

app.post("/signup", (req, res) => { 
    const userobj={
        firstname:"vrit",
        lastname:"Pastagiya",
        email:"vrit@gmail.com",
        pass:"vrit"
        }
        const user = new User(userobj);
        user.save()
        .then(() => {
            res.send("User Signed Up Successfully")
        })
        .catch((err) => {
            res.status(500).send("Error signing up user: " + err.message);
        });
    })

app.post("/user", userAuth, (req, res) => {
    res.send("User Created")
})  

app.get("/user/info", userAuth, (req, res) => {
    res.send("Prit Pastagiya")
})

app.use("/admin", adminAuth)

app.get("/admin/getAllData", (req, res) => {
    res.send("All data Generated")
})

app.get("/admin/deleteData", (req, res) => {
    res.send("Data Deleted")
})


connectDB()
.then(() => {
    console.log("Database connected successfully");
    app.listen(port, () => {
    console.log("Server started running on port " + port)
})
})
.catch((err) => {
    console.error("Database connection error:", err);
}); 

