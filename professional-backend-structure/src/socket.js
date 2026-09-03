import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Message } from "./models/message.model.js";
import { Transaction } from "./models/transaction.model.js";
import { ClaimChat, ClaimMessage } from "./models/claimChat.model.js";
import { OfferChat } from "./models/offerChat.model.js";

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || 
                          socket.handshake.headers.authorization?.replace("Bearer ", "");
            
            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            socket.userId = decoded._id;
            next();
        } catch (error) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.userId}`);

        // Join transaction room
        socket.on("join-transaction", async (transactionId) => {
            try {
                const transaction = await Transaction.findById(transactionId);
                if (!transaction) {
                    socket.emit("error", { message: "Transaction not found" });
                    return;
                }

                // Verify user is participant
                const isParticipant = 
                    transaction.owner.toString() === socket.userId ||
                    transaction.requester.toString() === socket.userId;

                if (!isParticipant) {
                    socket.emit("error", { message: "Not authorized" });
                    return;
                }

                // Check transaction status allows chat
                if (!['ACCEPTED', 'AGREEMENT_PROPOSED', 'ACTIVE', 'RETURN_PENDING', 'DISPUTED'].includes(transaction.status)) {
                    socket.emit("error", { message: "Chat not available for this transaction status" });
                    return;
                }

                socket.join(`transaction:${transactionId}`);
                socket.emit("joined", { transactionId });
            } catch (error) {
                socket.emit("error", { message: "Failed to join transaction" });
            }
        });

        // Send message
        socket.on("send-message", async ({ transactionId, content }) => {
            try {
                const transaction = await Transaction.findById(transactionId);
                if (!transaction) {
                    socket.emit("error", { message: "Transaction not found" });
                    return;
                }

                const isParticipant = 
                    transaction.owner.toString() === socket.userId ||
                    transaction.requester.toString() === socket.userId;

                if (!isParticipant) {
                    socket.emit("error", { message: "Not authorized" });
                    return;
                }

                const message = await Message.create({
                    transaction: transactionId,
                    sender: socket.userId,
                    content
                });

                const populatedMessage = await Message.findById(message._id)
                    .populate("sender", "fullName avatar");

                io.to(`transaction:${transactionId}`).emit("new-message", populatedMessage);
            } catch (error) {
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // Leave transaction room
        socket.on("leave-transaction", (transactionId) => {
            socket.leave(`transaction:${transactionId}`);
        });

        // Typing indicators
        socket.on("typing", ({ transactionId }) => {
            socket.to(`transaction:${transactionId}`).emit("user-typing", { userId: socket.userId });
        });

        socket.on("stop-typing", ({ transactionId }) => {
            socket.to(`transaction:${transactionId}`).emit("user-stop-typing", { userId: socket.userId });
        });

        // ========== CLAIM CHAT HANDLERS ==========

        // Join claim chat room
        socket.on("join-claim-chat", async (chatId) => {
            try {
                const chat = await ClaimChat.findById(chatId);
                if (!chat) {
                    socket.emit("error", { message: "Chat not found" });
                    return;
                }

                const isParticipant = chat.participants.some(
                    p => p.toString() === socket.userId
                );
                if (!isParticipant) {
                    socket.emit("error", { message: "Not authorized to join this chat" });
                    return;
                }

                if (!chat.isActive) {
                    socket.emit("error", { message: "This chat is no longer active" });
                    return;
                }

                socket.join(`claim-chat:${chatId}`);
                socket.emit("claim-chat-joined", { chatId });
            } catch (error) {
                socket.emit("error", { message: "Failed to join claim chat" });
            }
        });

        // Send message in claim chat
        socket.on("send-claim-message", async ({ chatId, content, messageType = 'TEXT', metadata }) => {
            try {
                const chat = await ClaimChat.findById(chatId);
                if (!chat) {
                    socket.emit("error", { message: "Chat not found" });
                    return;
                }

                const isParticipant = chat.participants.some(
                    p => p.toString() === socket.userId
                );
                if (!isParticipant) {
                    socket.emit("error", { message: "Not authorized" });
                    return;
                }

                if (!chat.isActive) {
                    socket.emit("error", { message: "This chat is no longer active" });
                    return;
                }

                const message = await ClaimMessage.create({
                    chat: chatId,
                    sender: socket.userId,
                    content,
                    messageType,
                    metadata,
                    readBy: [{ user: socket.userId, readAt: new Date() }]
                });

                chat.lastMessage = {
                    content: content || 'Sent a message',
                    sender: socket.userId,
                    timestamp: new Date()
                };

                chat.participants.forEach(participant => {
                    if (participant.toString() !== socket.userId) {
                        const currentCount = chat.unreadCount.get(participant.toString()) || 0;
                        chat.unreadCount.set(participant.toString(), currentCount + 1);
                    }
                });
                await chat.save();

                const populatedMessage = await ClaimMessage.findById(message._id)
                    .populate("sender", "fullName username avatar");

                io.to(`claim-chat:${chatId}`).emit("new-claim-message", populatedMessage);
            } catch (error) {
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // Typing indicators for claim chat
        socket.on("claim-typing", ({ chatId }) => {
            socket.to(`claim-chat:${chatId}`).emit("claim-user-typing", { userId: socket.userId });
        });

        socket.on("claim-stop-typing", ({ chatId }) => {
            socket.to(`claim-chat:${chatId}`).emit("claim-user-stop-typing", { userId: socket.userId });
        });

        // Mark messages read in claim chat
        socket.on("claim-mark-read", async ({ chatId }) => {
            try {
                const chat = await ClaimChat.findById(chatId);
                if (!chat) {
                    socket.emit("error", { message: "Chat not found" });
                    return;
                }

                const isParticipant = chat.participants.some(
                    p => p.toString() === socket.userId
                );
                if (!isParticipant) {
                    socket.emit("error", { message: "Not authorized" });
                    return;
                }

                await ClaimMessage.updateMany(
                    {
                        chat: chatId,
                        'readBy.user': { $ne: socket.userId }
                    },
                    {
                        $push: {
                            readBy: { user: socket.userId, readAt: new Date() }
                        }
                    }
                );

                chat.unreadCount.set(socket.userId, 0);
                await chat.save();

                io.to(`claim-chat:${chatId}`).emit("claim-messages-read", {
                    chatId,
                    userId: socket.userId
                });
            } catch (error) {
                socket.emit("error", { message: "Failed to mark messages as read" });
            }
        });

        // Leave claim chat room
        socket.on("leave-claim-chat", (chatId) => {
            socket.leave(`claim-chat:${chatId}`);
        });

        // ========== OFFER CHAT HANDLERS ==========

        // Join offer chat room
        socket.on("join-offer-chat", async (offerId) => {
            try {
                const chat = await OfferChat.findOne({ offer: offerId });
                if (!chat) {
                    socket.emit("error", { message: "Chat not found" });
                    return;
                }

                const isParticipant = chat.requester.toString() === socket.userId ||
                                      chat.offerer.toString() === socket.userId;
                if (!isParticipant) {
                    socket.emit("error", { message: "Not authorized to join this chat" });
                    return;
                }

                if (!chat.isActive) {
                    socket.emit("error", { message: "This chat is no longer active" });
                    return;
                }

                socket.join(`offer-chat:${offerId}`);
                socket.emit("offer-chat-joined", { offerId });
            } catch (error) {
                socket.emit("error", { message: "Failed to join offer chat" });
            }
        });

        // Leave offer chat room
        socket.on("leave-offer-chat", (offerId) => {
            socket.leave(`offer-chat:${offerId}`);
        });

        // Typing indicators for offer chat
        socket.on("offer-typing", ({ offerId }) => {
            socket.to(`offer-chat:${offerId}`).emit("offer-user-typing", { userId: socket.userId });
        });

        socket.on("offer-stop-typing", ({ offerId }) => {
            socket.to(`offer-chat:${offerId}`).emit("offer-user-stop-typing", { userId: socket.userId });
        });

        // Mark messages read in offer chat
        socket.on("offer-mark-read", async ({ offerId }) => {
            try {
                const chat = await OfferChat.findOne({ offer: offerId });
                if (!chat) {
                    socket.emit("error", { message: "Chat not found" });
                    return;
                }

                const isParticipant = chat.requester.toString() === socket.userId ||
                                      chat.offerer.toString() === socket.userId;
                if (!isParticipant) {
                    socket.emit("error", { message: "Not authorized" });
                    return;
                }

                chat.messages.forEach(msg => {
                    if (!msg.readBy.some(id => id.toString() === socket.userId)) {
                        msg.readBy.push(socket.userId);
                    }
                });
                await chat.save();

                io.to(`offer-chat:${offerId}`).emit("offer-messages-read", {
                    offerId,
                    userId: socket.userId
                });
            } catch (error) {
                socket.emit("error", { message: "Failed to mark messages as read" });
            }
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

// Helper to emit notifications
export const emitNotification = (userId, notification) => {
    if (io) {
        io.to(`user:${userId}`).emit("notification", notification);
    }
};
