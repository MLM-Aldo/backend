const { Queue, Worker } = require('bullmq');
const { redisClient } = require('./redis');
const { startJob } = require('../services/referral')

// Create a new queue with a unique name
const queueName = 'my-queue';
const queue = new Queue(queueName, { connection: redisClient });

// Add a task to the queue
const addTask = async (data) => {
  await queue.add('process-task', data);
};

// Process a task from the queue
const processTask = async (job) => {
  // Perform your task here

  startJob(job);

  console.log(`Processing task ${job.referredBy}`);
};

// Create a worker to process tasks from the queue
const worker = new Worker(queueName, processTask, { connection: redisClient });

// Listen for job completion events
worker.on('completed', (job) => {
  console.log(`Task ${job.id} completed`);
});

// Export the addTask function for other modules to use
module.exports = { addTask };
