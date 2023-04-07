const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const winston = require("winston");
const consoleTransport = new winston.transports.Console();
const myWinstonOptions = {
  transports: [consoleTransport],
};
const logger = new winston.createLogger(myWinstonOptions);

function logRequest(req, res, next) {
  logger.info(req.url);
  next();
}

function logError(err, req, res, next) {
  logger.error(err);
  next();
}

const PORT = 3001;
const app = express();

app.use(logRequest);
app.use(logError);

app.use(
  cors({
    origin: "*",
    credentials: true, // allow sending cookies across domains
    exposedHeaders: ["*"],
    allowedHeaders: ["*"],
  })
);

app.set("trust proxy", 1);

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const swaggerUi = require("swagger-ui-express"),
  swaggerDocument = require("./swagger-output.json");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Define the routes
const userRoutes = require("./routes/userRoutes.js");
const referralRoutes = require("./routes/referralRoutes.js");

const authenticateToken = (req, res, next) => {
  // skip for following routes.
  if (
    req.path === "/users/register" ||
    req.path === "/users/login" ||
    req.path == "/test" ||
    req.path == "/api-docs"
  ) {
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) return res.sendStatus(403);

    req.userId = decoded.userId;
    next();
  });
};

app.use(authenticateToken);

app.get("/test", (req, res) => {
  res.send("Hello, world!");
});

app.use("/users", userRoutes);
app.use("/referrals", referralRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then((result) => {
    app
      .listen(PORT, function () {
        console.log("The SERVER HAS STARTED ON PORT: "+ PORT);
      })
      //Fix the Error EADDRINUSE
      .on("error", function (err) {
        process.once("SIGUSR2", function () {
          process.kill(process.pid, "SIGUSR2");
        });
        process.on("SIGINT", function () {
          // this is only called on ctrl+c, not restar
          process.kill(process.pid, "SIGINT");
        });
      });
  })
  .catch((err) => {
    console.log(err);
  });
