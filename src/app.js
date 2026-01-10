const express = require("express")
const app = express();
const port = 3000;
const connectDB = require("./config/database")
const {adminAuth,userAuth} = require("./middlewares/auth")
const User = require("./models/user")
app.use(express.json());


app.post("/signup", (req, res) => { 
    console.log(req.body);
    // const userobj={
    //     firstname:"Prit",
    //     lastname:"Pastagiya",
    //     email:"Prit@gmail.com",
    //     pass:"Prit"
    //     }
  

    // {
    //     "firstname":"1Prit",
    //     "lastname":"1Pastagiya",
    //     "email":"1Prit@gmail.com",
    //     "pass":"1Prit"
    // }
        const user = new User(req.body);
        user.save()
        .then(() => {
            res.send("User Signed Up Successfully")
        })
        .catch((err) => {
            res.status(500).send("Error signing up user: " + err.message);
        });
    })

app.get("/user", async (req, res) => {
    const email = req.body.email;
    // console.log(email);
    try{
        const user = await User.findOne({ email: email });
        // console.log(user);
        if (user.length === 0) {
            return res.status(404).send("User not found");
        }else{
        res.send(user);
        }
    } catch (err) {
        res.status(500).send("User not found");
    }
});

app.get("/feed", async  (req, res) => {
    try {
        const users =await User.find();
        if (users.length === 0) {
            return res.status(404).send("No users found");
        }   else{
            // console.log(users);
            res.send(users);
        }
    
    } catch (err) {
        res.status(500).send("Error fetching users: " + err.message);
    }       
});

app.delete("/user", async (req, res) => {
    const email = req.body.email;   
    try {
        const deletedUser = await User.findOneAndDelete({ email: email });
        if (!deletedUser) {
            return res.status(404).send("User not found");
        }  else{
            res.send(deletedUser);
            res.send("User deleted successfully");
        }
    } catch (err) {
        res.status(500).send("Error deleting user: " + err.message);
    }       
});

app.delete("/user", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      user: deletedUser
    });

  } catch (err) {
    console.error("Error deleting user:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.patch("/user/:userId", async (req, res) => {
    const userId = req.params?.userId;
    console.log(userId);
    const updateduser = req.body;
    console.log(updateduser);
    try {
        const allowedUpdates = ['firstname', 'lastname', 'email', 'age', 'gender'];
        const updates = Object.keys(updateduser);
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) {
          throw new Error('Invalid updates!');
        }
        const updatedUser = await User.findByIdAndUpdate({_id : userId} , updateduser, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).send("User not found");
        }   else{
            res.send("User updated successfully");
        }
    } catch (err) {
        res.status(500).send("Error updating user: " + err.message);
    }
});



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


// app.use("/",(err, req, res, next) => {
//   console.error(err.stack); 
//   res.status(500).send('Something went wrong!');
// });

// app.post("/user", userAuth, (req, res) => {
//     res.send("User Created")
// })  

// app.get("/user/info", userAuth, (req, res) => {
//     res.send("Prit Pastagiya")
// })

// app.use("/admin", adminAuth)

// app.get("/admin/getAllData", (req, res) => {
//     res.send("All data Generated")
// })

// app.get("/admin/deleteData", (req, res) => {
//     res.send("Data Deleted")
// })