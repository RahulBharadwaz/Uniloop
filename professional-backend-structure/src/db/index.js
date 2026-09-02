import mongoose from "mongoose";
import dns from "dns";
import { DB_NAME } from "../constants.js";

// Ensure reliable SRV resolution on Windows and various ISPs
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
    // Ignore if setServers is restricted
}

export const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI.trim();

        // Safely URL-encode credentials if unencoded special characters like @ exist
        const prefix = uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : (uri.startsWith('mongodb://') ? 'mongodb://' : '');
        if (prefix) {
            const rest = uri.substring(prefix.length);
            const lastAt = rest.lastIndexOf('@');
            if (lastAt !== -1) {
                const creds = rest.substring(0, lastAt);
                const hostAndQuery = rest.substring(lastAt + 1);
                const firstColon = creds.indexOf(':');
                if (firstColon !== -1) {
                    const user = encodeURIComponent(decodeURIComponent(creds.substring(0, firstColon)));
                    const pass = encodeURIComponent(decodeURIComponent(creds.substring(firstColon + 1)));
                    uri = `${prefix}${user}:${pass}@${hostAndQuery}`;
                }
            }
        }

        // Handle database name and query parameters cleanly
        let uriWithDb;
        if (uri.includes('?')) {
            const [base, query] = uri.split('?');
            const cleanBase = base.replace(/\/$/, '');
            uriWithDb = cleanBase.endsWith(`/${DB_NAME}`) ? `${cleanBase}?${query}` : `${cleanBase}/${DB_NAME}?${query}`;
        } else {
            const cleanUri = uri.replace(/\/$/, '');
            uriWithDb = cleanUri.endsWith(`/${DB_NAME}`) ? cleanUri : `${cleanUri}/${DB_NAME}`;
        }

        const connectionInstance = await mongoose.connect(uriWithDb);
        console.log(`\n MongoDB Connected !! ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log('MONGO DB connection error', error);
        process.exit(1);
    }
};
