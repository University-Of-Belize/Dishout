import express, { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import config from "./config/settings.json";
import serviceAccount from "./config/service_account.json";
import { LogError, LogServer } from "./util/Logger";
import createDatabase from "./database";
import cors from "cors";
// import { v4 as uuid } from "uuid";
import path from "path";
import routes from "./api/routes";
import { get_authorization } from "./api/utility/Authentication"; // For rate-limiting
import { isValidTimeZone } from "./api/utility/time";

// Check the config file
// For a weird, unexplainable reason, it looks better with two 'log's
if (!config || !serviceAccount) {
  console.error(
    "\n\nConfig file or Firebase service account configuration not found. Please configure these files manually."
  );
  LogError("Config file or Firebase service account configuration not found. Please configure these files manually.");
  process.exit(1);
}
// Check the config file
if (!isValidTimeZone(config.server.defaultTimeZone)) {
  console.error(
    "\n\nInvalid timezone in config file. Please set a valid TZ to continue."
  );
  LogError(
    "Invalid timezone in config file. Please set a valid TZ to continue."
  );
  process.exit(1);
}
/********************************** */

const app = express();
const port = process.env.PORT ?? config.server.port;
app.set("trust proxy", 2); // Number of Machines: Currently we're running on 2 Machines

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes (in milliseconds)
  limit: 200, // Limit each IP to 3000 requests per 15 minutes (200/min)
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: true, // Enable the `X-RateLimit-*` headers.
  // store: ... , // Use an external store for consistency across multiple server instances.
  statusCode: 429, // Rate limit HTTP Code
  // @ts-ignore
  keyGenerator: (req: Request) =>
    get_authorization(req) ?? req.clientId ?? req.ip, // Otherwise, we use the IP address.
  handler: (req: Request, res: Response, next, options) => {
    res
      .status(options.statusCode)
      .json({
        status: false,
        message:
          options.message +
          ` Retry again after: ${res.getHeader("Retry-After")}s`,
      });
  },
  message: "Slow down! The resource is being rate limited.",
});

// Generate a unique ID for all the clients -- Apply this before anything else
// app.use((req, res, next) => {
//   // Add a custom field
//   // @ts-ignore --- We're supposed to get the private IP of the user
//   // res.set("clientId", uuid()); // Assign a unique ID to every client
//   next(); // This middleware is finished
// })
app.disable("x-powered-by");
app.use(cors()); // Shield the server from cross-domain requests -- apply cors before the rate limiter
app.use(express.json({limit: '4mb'})); // Enable body parsing -- enable body parsing before the rate limiter
app.use(express.urlencoded({ extended: false })); // Turn off URL encoding -- enable before rate limiting
// Apply the rate limiting middleware to all requests.
app.use(limiter); // Enable rate limiting. We don't want to get beat up
app.use(`/api/${config.api.API_SVERSION}`, routes); // Setup our routes
app.use("/", express.static(path.join(__dirname, "static"))); // Finally, serve our static files
app.get("/proxy", (request, response) =>
  response.json({
    what: "system",
    is: [request.ip, request.headers["x-forwarded-for"]],
  })
); // Utility path for checking # of proxies (running machines)

// Create our database (if needed)
createDatabase();

// Setup our servername
const ServerName = `DISHOUT.${process.env.NODE_ENV ?? "dev"}.${
  require("os").hostname() ?? "container"
}.${process.platform}.${process.env.PROCESSOR_ARCHITECTURE ?? "undefined"}#${
  process.pid
}`;

app.listen(port, () => {
  LogServer(`Running on port ${port}\n`);
  LogServer(`Hello! My name is: '${ServerName}'`);
});
