export interface StoreRequest {
  userId: string;
  data: any;
}

export interface ShardData {
  userId: string;
  data: any;
  timestamp: Date;
}

export interface ShardInfo {
  shardId: number;
  dataCount: number;
  userIds: string[];
}

export interface ShardStats {
  totalShards: number;
  totalRecords: number;
  shardDistribution: ShardInfo[];
}

