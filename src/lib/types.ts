// Garage Admin API response types

export interface GarageNode {
  id: string;
  garageVersion: string;
  addr: string;
  hostname: string;
  isUp: boolean;
  lastSeenSecsAgo: number | null;
  role: {
    zone: string;
    tags: string[];
    capacity: number;
  } | null;
  draining: boolean;
  dataPartition: {
    available: number;
    total: number;
  } | null;
}

export interface ClusterStatus {
  layoutVersion: number;
  nodes: GarageNode[];
}

export interface ClusterLayout {
  version: number;
  roles: {
    id: string;
    zone: string;
    capacity: number;
    tags: string[];
  }[];
  stagedRoleChanges: unknown[];
}

export interface BucketListItem {
  id: string;
  created: string;
  globalAliases: string[];
  localAliases: string[];
}

export interface BucketInfo {
  id: string;
  created: string;
  globalAliases: string[];
  websiteAccess: boolean;
  websiteConfig: { indexDocument: string; errorDocument: string } | null;
  keys: {
    accessKeyId: string;
    name: string;
    permissions: { read: boolean; write: boolean; owner: boolean };
    bucketLocalAliases: string[];
  }[];
  objects: number;
  bytes: number;
  unfinishedUploads: number;
  quotas: { maxSize: number | null; maxObjects: number | null };
}

export interface KeyListItem {
  id: string;
  name: string;
  created: string;
  expiration: string | null;
  expired: boolean;
}

export interface KeyInfo {
  accessKeyId: string;
  secretAccessKey?: string;
  created: string;
  name: string;
  expiration: string | null;
  expired: boolean;
  permissions: { createBucket: boolean };
  buckets: {
    id: string;
    globalAliases: string[];
    localAliases: string[];
    permissions: { read: boolean; write: boolean; owner: boolean };
  }[];
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
  isFolder: boolean;
}

export interface DashboardStats {
  bucketCount: number;
  keyCount: number;
  storageUsed: number;
  storageTotal: number;
  nodeStatus: "healthy" | "degraded";
  recentUploads: {
    key: string;
    bucket: string;
    size: number;
    lastModified: string;
  }[];
}
