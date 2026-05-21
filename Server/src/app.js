// src/app.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";

// Cloudinary v2 import (recommended)
import { v2 as cloudinary } from "cloudinary";

// multer-storage-cloudinary is CommonJS → default import + destructure
import msCloudinary from "multer-storage-cloudinary";
const { CloudinaryStorage } = msCloudinary;

const app = express();

// CORS
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
    })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer + Cloudinary storage config
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "avatars", // Cloudinary folder name
        allowed_formats: ["jpg", "png", "jpeg"],
        public_id: (req, file) => file.originalname, // file ka naam
    },
});

const upload = multer({ storage });

// Export upload middleware (for routes me use karne ke liye)
export { upload };

// routes import
import userRouter from "./routes/user.routes.js";
import helpRequestRouter from "./routes/helpRequest.routes.js";
import donationRouter from "./routes/donation.routes.js";
import adminRouter from "./routes/admin.routes.js";
import smsRouter from "./routes/sms.routes.js";
import conversationRouter from "./routes/conversation.routes.js";
import messageRouter from "./routes/message.routes.js";
import campRouter from "./routes/camp.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/help-requests", helpRequestRouter);
app.use("/api/v1/donations", donationRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/conversations", conversationRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/sms", smsRouter);
app.use("/api/v1/camps", campRouter);

// url : http://localhost:8000/api/v1/users/register

// url : http://localhost:8000/api/v1/users/register

// Example URL for post routes:
// http://localhost:8000/api/v1/posts/createPost
// http://localhost:8000/api/v1/posts/allPosts
// http://localhost:8000/api/v1/posts/singlePost/:id
// http://localhost:8000/api/v1/posts/updatePost/:id
// http://localhost:8000/api/v1/posts/deletePost/:id
// http://localhost:8000/api/v1/posts/addComment/:id

// Global error handling middleware (must be at the end)
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export { app }