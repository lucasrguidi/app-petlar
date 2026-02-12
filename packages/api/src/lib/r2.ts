import { env } from '@app-petlar/env/server'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { nanoid } from 'nanoid'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

/**
 * Generate a unique file key with the original extension
 */
export function generateFileKey(filename: string): string {
  const extension = filename.split('.').pop() || 'jpg'
  const uniqueId = nanoid()
  return `cats/${uniqueId}.${extension}`
}

/**
 * Generate a unique file key for application uploads
 */
export function generateApplicationFileKey(filename: string): string {
  const extension = filename.split('.').pop() || 'jpg'
  const uniqueId = nanoid()
  return `applications/${uniqueId}.${extension}`
}

/**
 * Get a presigned URL for uploading a file directly to R2
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(r2Client, command, { expiresIn })
}

/**
 * Get the public URL for an uploaded file
 */
export function getPublicUrl(key: string): string {
  return `${env.R2_PUBLIC_URL}/${key}`
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}

/**
 * Extract the key from a public URL
 */
export function getKeyFromUrl(url: string): string | null {
  if (!url.startsWith(env.R2_PUBLIC_URL)) {
    return null
  }
  return url.replace(`${env.R2_PUBLIC_URL}/`, '')
}
