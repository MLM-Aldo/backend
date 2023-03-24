const redis = require('ioredis');
const connectRedis = require('connect-redis');
const session = require('express-session');
const RedisStore = connectRedis(session);
const redisHost = process.env.REDIS_HOST || 'localhost';


const redisClient = redis.createClient({
    port: 6379,
    host: redisHost
});

module.exports = {
    redisClient: redisClient,
    RedisStore: RedisStore,
    session: session
}