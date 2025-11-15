const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;

async function initRedis() {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '11769'),
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Too many reconnection attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
      isConnected = true;
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    console.log('✅ Redis ping successful');

    return redisClient;
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    isConnected = false;
    return null;
  }
}

async function getRedisClient() {
  if (!redisClient || !isConnected) {
    return await initRedis();
  }
  return redisClient;
}

async function closeRedis() {
  if (redisClient && isConnected) {
    await redisClient.quit();
    isConnected = false;
    console.log('Redis connection closed');
  }
}

module.exports = {
  initRedis,
  getRedisClient,
  closeRedis,
  get isConnected() {
    return isConnected;
  }
};
