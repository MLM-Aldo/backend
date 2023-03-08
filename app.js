// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const dotenv = require('dotenv').config();

// Create a new instance of the express server
const app = express();

// Configure the bodyParser middleware to handle JSON data
app.use(bodyParser.json());


// Define the user routes
const userRoutes = require('./routes/userRoutes.js');
app.use('/users', userRoutes);


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