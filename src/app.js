const express = require("express")
const app = express();
const port = 3000;
const {adminAuth,userAuth} = require("./middlewares/auth")
app.post("/user", userAuth, (req, res) => {
    res.send("User Created")
})  
app.get("/user", userAuth, (req, res) => {
    res.send("Prit Pastagiya")
})

app.use("/admin", adminAuth)
app.get("/admin/getAllData", (req, res) => {
    res.send("All data Generated")
})
app.get("/admin/deleteData", (req, res) => {
    res.send("Data Deleted")
})
app.listen(port, () => {
    console.log("Server started running on port " + port)
})
