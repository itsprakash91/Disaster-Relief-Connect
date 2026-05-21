import connectDB from "./db/db.js";
import mongoose from "mongoose";
import { app } from "./app.js";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";

connectDB()
    .then(() => {
        // Ensure any legacy unique index on `helpRequest` that enforces uniqueness on null
        // is removed, then create the intended partial index from the Mongoose model.
        // This avoids the MongoServerError: E11000 duplicate key error for helpRequest:null.
        (async () => {
            try {
                const coll = mongoose.connection.collection('conversations');
                // Attempt to drop legacy index `helpRequest_1` if it exists
                try {
                    const indexes = await coll.indexes();
                    const hasLegacy = indexes.some(idx => idx.name === 'helpRequest_1' && idx.unique);
                    if (hasLegacy) {
                        await coll.dropIndex('helpRequest_1');
                        console.log('✅ Dropped legacy unique index helpRequest_1');
                    }
                } catch (dropErr) {
                    // Non-fatal: log and continue (index may not exist)
                    console.log('ℹ️ Index drop check error (non-fatal):', dropErr.message || dropErr);
                }
            } catch (err) {
                console.log('⚠️ Could not adjust conversation indexes:', err.message || err);
            }
        })();
        app.on("error", (error) => {
            console.log("Error: ", error);
            throw error;
        });

        const port = process.env.PORT || 4000;
        const httpServer = createServer(app);

        // Initialize Socket.IO with authentication
        const io = new IOServer(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN || "*",
                methods: ["GET", "POST"],
                credentials: true,
            },
        });

        // Socket.IO authentication middleware
        io.use((socket, next) => {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
            if (!token) {
                return next(new Error("Authentication error: no token provided"));
            }
            try {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "your-secret-key");
                socket.userId = decoded._id;
                socket.userRole = decoded.role;
                next();
            } catch (err) {
                next(new Error("Authentication error: invalid token"));
            }
        });

        // Socket event handlers
        // Maintain a mapping of userId -> Set of socketIds so server can target user's sockets
        const userSockets = new Map();
        app.set("userSockets", userSockets);

        io.on("connection", (socket) => {
            console.log("New socket connected:", socket.id, "User:", socket.userId);

            // register socket under userId
            if (socket.userId) {
                const set = userSockets.get(socket.userId.toString()) || new Set();
                set.add(socket.id);
                userSockets.set(socket.userId.toString(), set);

                // Auto-join user to their own userId room so they can receive personal messages
                socket.join(socket.userId.toString());
                console.log(`✓ Socket ${socket.id} auto-joined user room: ${socket.userId}`);
            }

            socket.on("joinRoom", (roomId) => {
                socket.join(roomId);
                console.log(`Socket ${socket.id} joined room ${roomId}`);
            });

            socket.on("joinConversation", async (data) => {
                const { conversationId } = data;
                if (!conversationId) return;

                socket.join(conversationId);
                console.log(`✓ Socket ${socket.id} (User ${socket.userId}) joined conversation: ${conversationId}`);

                // Notify other participants in this conversation that a user is now online
                try {
                    const conv = await mongoose.model('Conversation').findById(conversationId);
                    if (conv) {
                        const otherUserId = conv.victimId.toString() === socket.userId.toString()
                            ? conv.volunteerId?.toString()
                            : conv.victimId?.toString();

                        if (otherUserId) {
                            const otherSocketIds = userSockets.get(otherUserId);
                            if (otherSocketIds) {
                                otherSocketIds.forEach(socketId => {
                                    const otherSocket = io.sockets.sockets.get(socketId);
                                    if (otherSocket) {
                                        otherSocket.join(conversationId);
                                        console.log(`✓ Auto-joined other participant ${otherUserId} to conversation ${conversationId}`);
                                    }
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error in joinConversation:', err);
                }
            });

            socket.on("leaveRoom", (roomId) => {
                socket.leave(roomId);
                console.log(`Socket ${socket.id} left room ${roomId}`);
            });

            socket.on("disconnect", () => {
                console.log("Socket disconnected:", socket.id);
                // remove from userSockets
                if (socket.userId) {
                    const set = userSockets.get(socket.userId.toString());
                    if (set) {
                        set.delete(socket.id);
                        if (set.size === 0) userSockets.delete(socket.userId.toString());
                    }
                }
            });
        });

        // Make io available to express handlers
        app.set("io", io);

        httpServer.listen(port, () => {
            console.log(`Server is running at port : ${port}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB Connection Failed !!!", err);
    });
