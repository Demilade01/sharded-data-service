import { config } from '../config';
import { ShardData, ShardInfo, ShardStats } from '../types';

export class ShardManager {
  private shards: Map<number, Map<string, ShardData>>;
  private shardCount: number;

  constructor(shardCount: number = config.shardCount) {
    this.shardCount = shardCount;
    this.shards = new Map();

    // Initialize shards
    for (let i = 0; i < this.shardCount; i++) {
      this.shards.set(i, new Map());
    }
  }

  /**
   * Calculate shard ID for a given userId using modulo
   */
  private getShardId(userId: string): number {
    // Convert userId to a number using hash or direct conversion
    const numericId = this.hashUserId(userId);
    return numericId % this.shardCount;
  }

  /**
   * Simple hash function to convert userId to number
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Store data for a userId
   */
  store(userId: string, data: any): number {
    const shardId = this.getShardId(userId);
    const shard = this.shards.get(shardId)!;

    shard.set(userId, {
      userId,
      data,
      timestamp: new Date(),
    });

    return shardId;
  }

  /**
   * Retrieve data for a userId
   */
  get(userId: string): ShardData | undefined {
    const shardId = this.getShardId(userId);
    const shard = this.shards.get(shardId)!;
    return shard.get(userId);
  }

  /**
   * Get all data in a specific shard
   */
  getShardData(shardId: number): ShardData[] {
    if (shardId < 0 || shardId >= this.shardCount) {
      throw new Error(`Invalid shard ID. Must be between 0 and ${this.shardCount - 1}`);
    }

    const shard = this.shards.get(shardId)!;
    return Array.from(shard.values());
  }

  /**
   * Get statistics about shard distribution
   */
  getStats(): ShardStats {
    const shardDistribution: ShardInfo[] = [];
    let totalRecords = 0;

    for (let i = 0; i < this.shardCount; i++) {
      const shard = this.shards.get(i)!;
      const userIds = Array.from(shard.keys());

      shardDistribution.push({
        shardId: i,
        dataCount: shard.size,
        userIds,
      });

      totalRecords += shard.size;
    }

    return {
      totalShards: this.shardCount,
      totalRecords,
      shardDistribution,
    };
  }

  /**
   * Find which shard contains a specific userId
   */
  findShardForUser(userId: string): number {
    return this.getShardId(userId);
  }

  /**
   * Clear all data (useful for testing)
   */
  clearAll(): void {
    for (let i = 0; i < this.shardCount; i++) {
      this.shards.get(i)!.clear();
    }
  }

  /**
   * Get total number of shards
   */
  getShardCount(): number {
    return this.shardCount;
  }
}

// Singleton instance
export const shardManager = new ShardManager();

