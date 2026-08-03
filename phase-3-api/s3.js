import {
  S3Client,
  HeadBucketCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = process.env.S3_BUCKET || 'pl-predictor';

const credentials = {
  accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin123'
};

// used server-to-server (bucket setup, admin calls) — inside Docker this is the
// "minio" service name, only reachable from other containers
// newer SDK versions attach checksum headers by default that MinIO's S3-compatible
// API returns "NotImplemented" for — opt back down to only-when-required
const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  credentials
});

// used only to generate presigned URLs — must be an address the *browser* can
// reach, which inside Docker is different from the address the API container uses
const s3Public = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  credentials
});

export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
  }

  // only objects under avatars/ are publicly readable — everything else in
  // the bucket stays private by default
  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: BUCKET,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${BUCKET}/avatars/*`
          }
        ]
      })
    })
  );
}

export async function getAvatarUploadUrl(key, contentType) {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(s3Public, command, { expiresIn: 300 }); // 5 minutes
}

export async function objectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export function getPublicUrl(key) {
  const base = process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || 'http://localhost:9000';
  return `${base}/${BUCKET}/${key}`;
}
