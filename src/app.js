const express = require("express")
const app = express();
const port = 3000;
const connectDB = require("./config/database")
const { userAuth } = require("./middlewares/auth")
const User = require("./models/user")
const { validatesignupdata } = require("./util/validation");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const authrouter = require("./routes/userauth");
const profilerouter = require("./routes/profile");
const userrouter = require("./routes/user");
const projectRouter = require("./routes/project");
const requestrouter = require("./routes/request");
const postRouter = require("./routes/post");
const notificationRouter = require("./routes/notification");
const bookmarkRouter = require("./routes/bookmark");
const adminRouter = require("./routes/admin");
const paymentRouter = require("./routes/payment");
const  intializeSocket  = require("./util/socket");
const chatRouter = require("./routes/chat");
const cors = require("cors");

const http = require("http");
const server = http.createServer(app);
intializeSocket(server);




// app.use(cors())
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

connectDB()
  .then(() => {
    console.log("Database connected successfully");
    server.listen(port, () => {
      console.log("Server started running on port " + port)
    })
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });


app.use("/auth", authrouter);

app.use("/profile", profilerouter);

app.use("/request", requestrouter);

app.use("/user", userrouter)

app.use("/post", postRouter);

app.use("/project", projectRouter);

app.use("/notification", notificationRouter);

app.use("/bookmark", bookmarkRouter);

app.use("/admin", adminRouter);

app.use("/", paymentRouter);

app.use("/", chatRouter);

// const express = require("express")
// const app = express();
// const port = 3000;
// const connectDB = require("./config/database")
// const {userAuth} = require("./middlewares/auth")
// const User = require("./models/user")
// const { validatesignupdata } = require("./util/validation");
// const bcrypt = require("bcrypt");
// const cookieParser = require("cookie-parser");
// const jwt = require("jsonwebtoken");
// const mongoose = require("mongoose");
// const authrouter = require("./routes/userauth");
// const profilerouter = require("./routes/profile");
// const userrouter = require("./routes/user");
// const projectRouter = require("./routes/project");
// const requestrouter = require("./routes/request");
// const postRouter = require("./routes/post");
// const cors = require("cors");

// // app.use(cors())
// app.use(express.json());
// app.use(cookieParser());

// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH" ,"DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// connectDB()
// .then(() => {
//     console.log("Database connected successfully");
//     app.listen(port, () => {
//     console.log("Server started running on port " + port)
// })
// })
// .catch((err) => {
//     console.error("Database connection error:", err);
// });


// app.use("/auth", authrouter);

// app.use("/profile", profilerouter);

// app.use("/request", requestrouter);

// app.use("/user", userrouter)

// app.use("/post", postRouter);

// app.use("/project", projectRouter);

// app.use(cors({
//   origin: "http://localhost:5173",
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));

// app.options("*", cors());
