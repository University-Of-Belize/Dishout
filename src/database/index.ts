import mongoose from "mongoose";
import process from "node:process";
import config from "../config/settings.json";
import { LogDatabase, LogError } from "../util/Logger";

const DatabaseURL = process.env.DATABASE_URL ?? config.database.mongoURI;
const TYPE =
  DatabaseURL.substring(0, 8) === "mongodb:" // Simple check to see if we're connected to a local or remote database
    ? "LOCAL"
    : DatabaseURL.substring(0, 8) === "mongodb+"
    ? "PROD"
    : "UNKNOWN";
mongoose.set("strictQuery", true); // We want some strict queries

export default async function connectDB() {
  try {
    await mongoose.connect(DatabaseURL).then(() => {
      LogDatabase(`Connected to MongoDB (TYPE: ${TYPE}, PID: ${process.pid})`);
    });
  } catch (err) {
    throw LogError(`${err}`);
  }
}
