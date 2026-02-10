import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { protectedProcedure, router } from '../index'
import {
  deleteFile,
  generateFileKey,
  getKeyFromUrl,
  getPresignedUploadUrl,
  getPublicUrl,
} from '../lib/r2'

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const uploadRouter = router({
  /**
   * Get a presigned URL for uploading a file directly to R2
   * Returns the presigned URL and the file key
   */
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        contentType: z
          .string()
          .refine((type) => ALLOWED_CONTENT_TYPES.includes(type), {
            message: `Content type must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
          }),
        fileSize: z.number().max(MAX_FILE_SIZE, {
          message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { filename, contentType } = input

      const key = generateFileKey(filename)
      const presignedUrl = await getPresignedUploadUrl(key, contentType)

      return {
        presignedUrl,
        key,
      }
    }),

  /**
   * Confirm upload and return the public URL
   */
  confirmUpload: protectedProcedure
    .input(
      z.object({
        key: z.string().min(1),
      })
    )
    .mutation(({ input }) => {
      const { key } = input
      const publicUrl = getPublicUrl(key)

      return {
        publicUrl,
        key,
      }
    }),

  /**
   * Delete a file from R2
   */
  deleteFile: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const { url } = input

      const key = getKeyFromUrl(url)
      if (!key) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid file URL',
        })
      }

      await deleteFile(key)

      return { success: true }
    }),
})
