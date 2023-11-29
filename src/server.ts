import express from "express";
import { rateLimit } from "express-rate-limit";
import config from "./config/settings.json";
import { LogServer } from "./util/Logger";
import createDatabase from "./database";
import cors from "cors";
import routes from "./api/routes";

const app = express();
const port = process.env.PORT ?? config.server.port;
app.set('trust proxy', 2) // Number of Machines: Currently we're running on 2 Machines

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (in milliseconds)
  limit: 100, // Limit each IP to 100 requests per 15 minutes.
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Use an external store for consistency across multiple server instances.
});

// Apply the rate limiting middleware to all requests.
app.use(limiter); // Enable rate limiting. We don't want to get beat up
app.use(cors()); // Shield the server from cross-domain requests
app.use(express.json()); // Enable body parsing
app.use(express.urlencoded({ extended: false })); // Turn off URL encoding
app.use(`/api/${config.api.API_SVERSION}`, routes); // Setup our routes

// Create our database
createDatabase();

// Setup our servername
const ServerName = `DISHOUT.${process.env.NODE_ENV ?? "dev"}.${require("os").hostname() ?? "container"
  }.${process.platform}.${process.env.PROCESSOR_ARCHITECTURE ?? "undefined"}#${process.pid
  }`;
  
  
app.get('/proxy', (request, response) => response.json({ what: "system", is: [request.ip, request.headers['X-Forwarded-For']] }))

app.listen(port, () => {
  LogServer(`Running on port ${port}\n`);
  LogServer(`Hello! My name is: '${ServerName}'`);
});
