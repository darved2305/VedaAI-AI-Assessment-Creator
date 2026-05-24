import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined in environment variables");

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME ?? "vedaai" });
  isConnected = true;
  console.log("MongoDB connected");
}
