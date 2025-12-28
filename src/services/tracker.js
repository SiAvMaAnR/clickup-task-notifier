import Redis from 'ioredis';
import { NOTIFICATION_TYPE } from '../constants.js';

export class TrackerClient {
  constructor(config) {
    this.redis = new Redis(config.url);
    this.keyPrefix = config.keyPrefix;
    this.ttlSeconds = config.ttlSeconds;
    this.redis.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
  }

  buildKey(taskId, type, status) {
    if (type === NOTIFICATION_TYPE.INCOMPLETE_TASK) {
      return `${this.keyPrefix}:${taskId}:${type}`;
    }

    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
    return `${this.keyPrefix}:${taskId}:${type}:${normalizedStatus}`;
  }

  async wasNotified(taskId, type, status) {
    const key = this.buildKey(taskId, type, status);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async markNotified(taskId, type, status) {
    const key = this.buildKey(taskId, type, status);
    await this.redis.setex(key, this.ttlSeconds, new Date().toISOString());
  }

  async close() {
    await this.redis.quit();
  }
}
