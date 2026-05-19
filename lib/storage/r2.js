import "server-only";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client;

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const region = process.env.R2_REGION || "auto";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing Cloudflare R2 environment variables.");
  }

  return {
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
}

function getClient() {
  if (!client) {
    client = new S3Client({
      ...getR2Config(),
      forcePathStyle: true,
    });
  }

  return client;
}

export async function uploadPrivateFile(bucket, path, file, { cacheControl = "3600", upsert = false } = {}) {
  if (!path || !file || file.size === 0) {
    return null;
  }

  if (!upsert && (await objectExists(bucket, path))) {
    throw new Error("File already exists.");
  }

  const body = Buffer.from(await file.arrayBuffer());

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      Body: body,
      ContentType: file.type || "application/octet-stream",
      ContentLength: file.size,
      CacheControl: cacheControl,
    })
  );

  return path;
}

export async function createPrivateFileUrl(bucket, path, expiresIn = 60 * 10) {
  if (!path) {
    return null;
  }

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: bucket,
      Key: path,
    }),
    { expiresIn }
  );
}

export async function deletePrivateFiles(bucket, paths) {
  const keys = [...new Set((paths || []).filter(Boolean))];

  if (!keys.length) {
    return;
  }

  for (let index = 0; index < keys.length; index += 1000) {
    const chunk = keys.slice(index, index + 1000);

    await getClient().send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
  }
}

export async function deletePrivateFile(bucket, path) {
  if (!path) {
    return;
  }

  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: path,
    })
  );
}

export async function deletePrivateFilesByPrefix(bucket, prefix) {
  if (!prefix) {
    return;
  }

  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  let continuationToken;

  do {
    const { Contents = [], IsTruncated, NextContinuationToken } = await getClient().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: normalizedPrefix,
        ContinuationToken: continuationToken,
      })
    );

    await deletePrivateFiles(
      bucket,
      Contents.map((object) => object.Key)
    );

    continuationToken = IsTruncated ? NextContinuationToken : null;
  } while (continuationToken);
}

export async function movePrivateFile(bucket, oldPath, nextPath) {
  if (!oldPath || !nextPath || oldPath === nextPath) {
    return;
  }

  await getClient().send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: nextPath,
      CopySource: `${bucket}/${encodeR2Key(oldPath)}`,
    })
  );

  await deletePrivateFile(bucket, oldPath);
}

async function objectExists(bucket, path) {
  const { Contents = [] } = await getClient().send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: path,
      MaxKeys: 1,
    })
  );

  return Contents.some((object) => object.Key === path);
}

function encodeR2Key(path) {
  return String(path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}
