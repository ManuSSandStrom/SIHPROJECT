import mongoose from "mongoose";


const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            family: 4, // Force IPv4 to avoid DNS EREFUSED errors
            // If you see "MongooseServerSelectionError", check MongoDB Atlas Network Access (IP Whitelist)
        });
        console.log("Database connected");
    } catch (error) {
        console.error("Database connection error", error);
        if (error.name === 'MongooseServerSelectionError') {
            console.error("\n❌ ACTION REQUIRED: Your IP is blocked. Go to MongoDB Atlas -> Network Access -> Add IP Address -> Add Current IP Address (or 0.0.0.0/0 for anywhere).\n");
        }
        process.exit(1);
    }
};

export default dbConnect;