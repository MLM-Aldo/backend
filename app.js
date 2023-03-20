// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const session = require('express-session');
const redis = require('ioredis');
const connectRedis = require('connect-redis');
const RedisStore = connectRedis(session);
const redisHost = process.env.REDIS_HOST || 'localhost';
const cors = require('cors');

const redisClient = redis.createClient({
  port: 6379,
  host: redisHost
});


var cookieParser = require('cookie-parser')

const PORT = 3001;

// Create a new instance of the express server
const app = express();

app.use(cors({
  origin: '*'
}));

app.use(session({
  store: new RedisStore({client: redisClient}),
  secret: 'mySecret',
  saveUninitialized: false,
  resave: false,
  name:'sessionId',
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 30,
  }
  
  }));

app.set('trust proxy', 1);


// Configure the bodyParser middleware to handle JSON data
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const swaggerUi = require("swagger-ui-express"),
swaggerDocument = require("./swagger-output.json");

app.use(
  '/api-docs',
  swaggerUi.serve, 
  swaggerUi.setup(swaggerDocument)
);

// Define the routes
const userRoutes = require('./routes/userRoutes.js');
const referralRoutes = require('./routes/referralRoutes.js');

const requireSession = (req, res, next) => {
  // Skip validation if this is the /users/register or /users/login route
  if (req.path === '/users/register' || req.path === '/users/login' || req.path == '/test' || req.path == '/api-docs' || req.path === '/users/allUsers') {
    return next();
  }

  // Validate session key
  if (!req.session || !req.session.userId) {
    res.status(401).send('Unauthorized');
  } else {
    next();
  }
};

app.use(requireSession);

app.get('/test', (req, res) => {
  res.send('Hello, world!');
});

app.use('/users', userRoutes);
app.use('/referrals', referralRoutes);

mongoose.connect(process.env.MONGO_URL).then(result => {
  app.listen(3001, function () {
   console.log('The SERVER HAS STARTED ON PORT: 3000');
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
}).catch(err => {
 console.log(err);
})
