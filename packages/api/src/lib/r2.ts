import { env } from '@app-petlar/env/server'
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
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
 * Generate a unique file key for adoption term PDFs
 */
export function generateAdoptionTermKey(filename: string): string {
  const extension = filename.split('.').pop() || 'pdf'
  const uniqueId = nanoid()
  return `adoption-terms/${uniqueId}.${extension}`
}

/**
 * Generate a unique file key for sponsor logos
 */
export function generateSponsorFileKey(filename: string): string {
  const extension = filename.split('.').pop() || 'jpg'
  const uniqueId = nanoid()
  return `sponsors/${uniqueId}.${extension}`
}

interface PresignedUploadOptions {
  expiresIn?: number
  contentLength?: number
}

/**
 * Get a presigned URL for uploading a file directly to R2
 *
 * When `contentLength` is provided it becomes part of the signature, so R2
 * rejects any PUT whose body size differs. Without it the declared size is
 * merely a claim by the client and the size limit is unenforceable.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  { expiresIn = 3600, contentLength }: PresignedUploadOptions = {}
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
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
 * Delete many files from R2 in batches of 1000 (the S3 API limit)
 */
export async function deleteFiles(keys: string[]): Promise<void> {
  for (let index = 0; index < keys.length; index += 1000) {
    const batch = keys.slice(index, index + 1000)

    await r2Client.send(
      new DeleteObjectsCommand({
        Bucket: env.R2_BUCKET_NAME,
        Delete: { Objects: batch.map((key) => ({ Key: key })) },
      })
    )
  }
}

export interface R2Object {
  key: string
  size: number
  lastModified: Date | null
}

/**
 * List every object under a prefix, following pagination to the end
 */
export async function listAllObjects(prefix: string): Promise<R2Object[]> {
  const objects: R2Object[] = []
  let continuationToken: string | undefined

  do {
    const response = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: env.R2_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    for (const item of response.Contents ?? []) {
      if (!item.Key) continue
      objects.push({
        key: item.Key,
        size: item.Size ?? 0,
        lastModified: item.LastModified ?? null,
      })
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined
  } while (continuationToken)

  return objects
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
