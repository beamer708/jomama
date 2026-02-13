import mongoose from "mongoose";

const DATABASE_URL = process.env.DATABASE_URL;

export async function connect(): Promise<void> {
  if (!DATABASE_URL || DATABASE_URL.trim() === "") {
    console.error("DATABASE_URL is required. Set it in your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(DATABASE_URL);
    console.log("MongoDB connected.");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}
