const express = require("express")
const app = express();
const port = 3000;
app.get("/user", (req, res) => {
    res.send("Prit Pastagiya")
})
app.post("/user", (req, res) => {
    res.send("Post request on user")    
})
app.use("/test", (req, res) => {
    res.send("Server started!")
})

app.use("/main", (req, res) => {
    res.send("another route")
})

app.listen(port, () => {
    console.log("Server started running on port " + port)
})
