const { createClient } = require("@supabase/supabase-js");
const { HeadObjectCommand, PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const BUCKETS = [
  ["company-documents", process.env.R2_COMPANY_DOCUMENTS_BUCKET || "company-documents"],
  ["employee-documents", process.env.R2_EMPLOYEE_DOCUMENTS_BUCKET || "employee-documents"],
  ["instrument-documents", process.env.R2_INSTRUMENT_DOCUMENTS_BUCKET || "instrument-documents"],
  ["site-attendance-documents", process.env.R2_SITE_ATTENDANCE_DOCUMENTS_BUCKET || "site-attendance-documents"],
  ["site-project-documents", process.env.R2_SITE_PROJECT_DOCUMENTS_BUCKET || "site-project-documents"],
  ["vehicle-documents", process.env.R2_VEHICLE_DOCUMENTS_BUCKET || "vehicle-documents"],
];

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const r2 = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function main() {
  const totals = {
    copied: 0,
    skipped: 0,
    failed: 0,
    bytes: 0,
  };

  for (const [sourceBucket, targetBucket] of BUCKETS) {
    console.log(`\n${sourceBucket} -> ${targetBucket}`);
    const objects = await listSupabaseObjects(sourceBucket);

    if (!objects.length) {
      console.log("  no objects");
      continue;
    }

    for (const object of objects) {
      const result = await migrateObject(sourceBucket, targetBucket, object);
      totals[result.status] += 1;
      totals.bytes += result.bytes || 0;
      console.log(`  ${result.status}: ${object.path}${result.reason ? ` (${result.reason})` : ""}`);
    }
  }

  console.log("\nMigration summary");
  console.log(`  copied: ${totals.copied}`);
  console.log(`  skipped: ${totals.skipped}`);
  console.log(`  failed: ${totals.failed}`);
  console.log(`  copied bytes: ${totals.bytes}`);

  if (totals.failed > 0) {
    process.exitCode = 1;
  }
}

async function listSupabaseObjects(bucket, prefix = "") {
  const objects = [];
  const limit = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`Failed to list ${bucket}/${prefix}: ${error.message}`);
    }

    const entries = data || [];

    for (const entry of entries) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (isFolder(entry)) {
        objects.push(...(await listSupabaseObjects(bucket, path)));
      } else {
        objects.push({
          path,
          size: Number(entry.metadata?.size || 0),
          contentType: entry.metadata?.mimetype || entry.metadata?.contentType || "application/octet-stream",
        });
      }
    }

    if (entries.length < limit) {
      break;
    }

    offset += limit;
  }

  return objects;
}

function isFolder(entry) {
  return !entry.id && !entry.metadata;
}

async function migrateObject(sourceBucket, targetBucket, object) {
  try {
    if (await r2ObjectExists(targetBucket, object.path)) {
      return {
        status: "skipped",
        reason: "already exists in R2",
      };
    }

    const { data, error } = await supabase.storage.from(sourceBucket).download(object.path);

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Supabase returned empty file data");
    }

    const body = Buffer.from(await data.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: targetBucket,
        Key: object.path,
        Body: body,
        ContentType: data.type || object.contentType,
        ContentLength: body.length,
      })
    );

    return {
      status: "copied",
      bytes: body.length,
    };
  } catch (error) {
    return {
      status: "failed",
      reason: error.message,
    };
  }
}

async function r2ObjectExists(bucket, key) {
  try {
    await r2.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") {
      return false;
    }

    throw error;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
