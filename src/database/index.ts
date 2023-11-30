import mongoose from "mongoose";
import process from "node:process";
import { LogDatabase, LogError } from "../util/Logger";
import config from "../config/settings.json";

const DatabaseURL = process.env.DATABASE_URL ?? config.database.mongoURI;
mongoose.set("strictQuery", true); // We want some strict queries

export default async function connectDB() {
  try {
    await mongoose.connect(DatabaseURL).then(() => {
      LogDatabase("Connected to MongoDB.");
    });
  } catch (err) {
    throw LogError(`${err}`);
  }
}
