const ADMIN_URL = process.env.GARAGE_ADMIN_URL!;
const ADMIN_TOKEN = process.env.GARAGE_ADMIN_TOKEN!;

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ADMIN_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${ADMIN_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Garage Admin API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Cluster
export async function getClusterStatus() {
  return adminFetch<{
    layoutVersion: number;
    nodes: {
      id: string;
      garageVersion: string;
      addr: string;
      hostname: string;
      isUp: boolean;
      lastSeenSecsAgo: number | null;
      role: { zone: string; tags: string[]; capacity: number } | null;
      draining: boolean;
      dataPartition: { available: number; total: number } | null;
    }[];
  }>("/v2/GetClusterStatus");
}

export async function getClusterLayout() {
  return adminFetch<{
    version: number;
    roles: { id: string; zone: string; capacity: number; tags: string[] }[];
    stagedRoleChanges: unknown[];
  }>("/v2/GetClusterLayout");
}

// Buckets
export async function listBuckets() {
  return adminFetch<
    { id: string; created: string; globalAliases: string[]; localAliases: string[] }[]
  >("/v2/ListBuckets");
}

export async function getBucketInfo(id: string) {
  return adminFetch<{
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
  }>(`/v2/GetBucketInfo?id=${id}`);
}

export async function createBucket(alias: string) {
  return adminFetch<{ id: string }>("/v2/CreateBucket", {
    method: "POST",
    body: JSON.stringify({ globalAlias: alias }),
  });
}

export async function deleteBucket(id: string) {
  return adminFetch<void>(`/v2/DeleteBucket?id=${id}`, {
    method: "POST",
  });
}

// Keys
export async function listKeys() {
  return adminFetch<
    { id: string; name: string; created: string; expiration: string | null; expired: boolean }[]
  >("/v2/ListKeys");
}

export async function getKeyInfo(id: string) {
  return adminFetch<{
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
  }>(`/v2/GetKeyInfo?id=${id}`);
}

export async function createKey(name: string) {
  return adminFetch<{
    accessKeyId: string;
    secretAccessKey: string;
    name: string;
  }>("/v2/CreateKey", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function deleteKey(id: string) {
  return adminFetch<void>(`/v2/DeleteKey?id=${id}`, {
    method: "POST",
  });
}

// Bucket-Key Permissions
export async function allowBucketKey(
  bucketId: string,
  accessKeyId: string,
  permissions: { read: boolean; write: boolean; owner: boolean }
) {
  return adminFetch<unknown>("/v2/AllowBucketKey", {
    method: "POST",
    body: JSON.stringify({ bucketId, accessKeyId, permissions }),
  });
}

export async function denyBucketKey(
  bucketId: string,
  accessKeyId: string,
  permissions: { read: boolean; write: boolean; owner: boolean }
) {
  return adminFetch<unknown>("/v2/DenyBucketKey", {
    method: "POST",
    body: JSON.stringify({ bucketId, accessKeyId, permissions }),
  });
}
