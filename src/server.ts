import express from "express";
import config from "./config/settings.json";
import { Server } from "./util";
import createDatabase from "./database";
import cors from "cors";
import routes from "./api/routes";

const app = express();
const port = process.env.PORT ?? config.server.port;
app.use(cors()); // Shield the server from cross-domain requests
app.use(express.json()); // Enable body parsing
app.use(express.urlencoded({ extended: false })); // Turn off URL encoding
app.use(`/api/${config.api.API_SVERSION}`, routes); // Setup our routes

// Create our database
createDatabase();

// Setup our servername
const ServerName = `DISHOUT.${process.env.NODE_ENV ?? "dev"}.${
  require("os").hostname() ?? "container"
}.${process.platform}.${process.env.PROCESSOR_ARCHITECTURE ?? "undefined"}#${
  process.pid
}`;

const server = app.listen(port, () => {
  Server(`Running on port ${port}\n`);
  Server(`Hello! My name is: '${ServerName}'`);
});
