# DevSwipe Backend 🚀

This repository contains the **backend server for DevSwipe**, a developer networking platform where developers can connect, share posts, collaborate on projects, explore job opportunities, and communicate in real-time.

The backend provides **REST APIs, authentication, database management, and real-time communication** services for the DevSwipe frontend application.

---

## ✨ Features

### 🔐 Authentication

* User signup and login
* Secure authentication using JWT
* Password encryption using bcrypt

### 👤 User Management

* Developer profile management
* Update profile information
* View other developer profiles

### 📰 Posts System

* Create posts
* View developer feed
* Comment on posts
* Like and save posts

### 📂 Project Management

* Create and manage projects
* View projects shared by developers
* Collaboration features

### 💼 Job System

* Create job listings
* Browse available jobs
* Apply for jobs

### 💬 Real-time Chat

* Real-time messaging using **Socket.io**
* Developer communication and collaboration

### 🔔 Notifications

* Activity notifications
* User interaction updates

### 🛠 Admin Controls

* Manage users
* Monitor platform activities

---

## 🛠 Tech Stack

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose ODM

### Authentication

* JSON Web Tokens (JWT)
* bcrypt.js

### Real-time Communication

* Socket.io

### Other Tools

* dotenv
* CORS
* Nodemon

---

## 📁 Project Structure

backend

│

├── controllers        # Business logic

├── models             # Database schemas

├── routes             # API routes

├── middleware         # Authentication and validations

├── config             # Database configuration

├── socket             # Real-time chat configuration

│

├── server.js          # Application entry point

├── package.json

└── README.md

---

## ⚙️ Installation

### 1️⃣ Clone the repository

git clone https://github.com/prit2006/backend.git

### 2️⃣ Navigate into the project

cd backend

### 3️⃣ Install dependencies

npm install

---

## 🔑 Environment Variables

Create a `.env` file in the root directory and add:

PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173

---

## ▶️ Running the Server

Start the development server:

npm run dev

or

node server.js

Server will run on:

http://localhost:5000

---

## 📡 API Usage

The backend exposes REST APIs used by the DevSwipe frontend for:

* Authentication
* User profiles
* Posts
* Projects
* Jobs
* Notifications
* Messaging

---

## 🤝 Contributing

Contributions are welcome.

Steps:

1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Push to your branch
5. Create a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

Developed by **Aksh Patel**
