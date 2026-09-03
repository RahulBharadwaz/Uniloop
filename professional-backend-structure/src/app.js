import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import compression from "compression"
import morgan from "morgan"

const app = express()

// ─── Security & Performance Middleware ───────────────────────────
app.use(helmet())
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Rate Limiting ──────────────────────────────────────────────
// Prevent brute-force on authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15-minute window
    max: 10,                    // max 10 OTP requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        success: false, 
        message: 'Too many verification attempts. Please try again after 15 minutes.' 
    }
})

// General API rate limiter (100 req/min per IP)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down.' }
})

app.use('/api/', apiLimiter)

// ─── CORS ───────────────────────────────────────────────────────
app.use(cors({
    origin: function (origin, callback) {
        const allowed = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || [];
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}))

// ─── Body Parsing ───────────────────────────────────────────────
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Routes import
import userRoutes from "./routes/user.route.js"
import itemRoutes from "./routes/item.route.js"
import requestRoutes from "./routes/request.route.js"
import transactionRoutes from "./routes/transaction.route.js"
import messageRoutes from "./routes/message.route.js"
import notificationRoutes from "./routes/notification.route.js"
import lostFoundRoutes from "./routes/lostFound.route.js"
import claimChatRoutes from "./routes/claimChat.route.js"
import wantedItemRoutes from "./routes/wantedItem.route.js"
import offerChatRoutes from "./routes/offerChat.route.js"

// Health Check Endpoints
app.get("/health", (req, res) => res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() }));
app.get("/", (req, res) => res.status(200).json({ name: "UniLoop API", status: "online", version: "1.0.0" }));

// Routes declaration
app.use("/api/v1/users", authLimiter, userRoutes)
app.use("/api/v1/items", itemRoutes)
app.use("/api/v1/requests", requestRoutes)
app.use("/api/v1/transactions", transactionRoutes)
app.use("/api/v1/messages", messageRoutes)
app.use("/api/v1/notifications", notificationRoutes)
app.use("/api/v1/lost-found", lostFoundRoutes)
app.use("/api/v1/claim-chats", claimChatRoutes)
app.use("/api/v1/wanted-items", wantedItemRoutes)
app.use('/api/v1/offer-chats', offerChatRoutes)

// ─── Error Handling Middleware ───────────────────────────────────
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
        console.error(err);
    } else {
        console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${statusCode}: ${err.message}`);
    }

    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 && isProduction 
            ? "Internal Server Error" 
            : err.message || "Internal Server Error",
        errors: err.errors || []
    });
});

export { app }
