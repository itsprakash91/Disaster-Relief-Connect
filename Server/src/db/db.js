import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        // Build connection string - handle cases where DB_NAME might already be in URI
        let connectionURI = process.env.MONGODB_URI;

        if (!connectionURI) {
            throw new Error("MONGODB_URI is missing. Add it to Server/.env before starting the server.");
        }

        // If connection string doesn't already include database name, add it
        if (!connectionURI.includes(DB_NAME) && !connectionURI.includes('?')) {
            connectionURI = `${connectionURI}/${DB_NAME}`;
        } else if (!connectionURI.includes(DB_NAME) && connectionURI.includes('?')) {
            // If there's already a query string, insert DB name before it
            connectionURI = connectionURI.replace('?', `/${DB_NAME}?`);
        }

        const connectionInstance = await mongoose.connect(connectionURI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });

        console.log(`\nMongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        console.log(`Database: ${connectionInstance.connection.name}`);
    } catch (error) {
        console.log("\nMONGODB connection error:", error.message);

        if (error.message.includes('IP') || error.message.includes('whitelist') || error.message.includes('ECONNRESET')) {
            console.log("\nIMPORTANT: MongoDB Atlas is rejecting or resetting the connection.");
            console.log("   1. Go to: https://cloud.mongodb.com");
            console.log("   2. Navigate to: Network Access > Add IP Address");
            console.log("   3. Click 'Add Current IP Address' or add '0.0.0.0/0' (for development only)");
            console.log("   4. Confirm the username/password and cluster name in Server/.env are correct");
        }

        process.exit(1);
    }
};

export default connectDB;
