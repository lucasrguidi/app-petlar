'use client'

import { useCallback, useEffect, useRef } from 'react'

import type { WorkerResponse } from './video-compression.worker'

/**
 * Whether this browser can transcode video locally. Falls back to uploading the
 * original file (under a smaller limit) when it can't.
 */
export function isVideoCompressionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof VideoEncoder !== 'undefined' &&
    typeof VideoDecoder !== 'undefined'
  )
}

interface CompressOptions {
  onProgress?: (progress: number) => void
}

/**
 * Diagnostics for answering "is transcoding fast enough on weak phones?".
 *
 * Deliberately coarse. The device model is not collected: iOS does not expose
 * it, and storing one alongside an applicant's name and phone would go beyond
 * what they consented to. Core count plus elapsed time answers the question
 * without identifying anyone.
 */
export interface CompressionDiagnostics {
  compressionMs: number
  originalSizeBytes: number
  originalWidth: number
  originalHeight: number
  hardwareConcurrency: number | null
  platform: 'ios' | 'android' | 'desktop' | 'other'
}

export interface CompressionResult {
  file: File
  diagnostics: CompressionDiagnostics
}

function detectPlatform(): CompressionDiagnostics['platform'] {
  if (typeof navigator === 'undefined') return 'other'

  const ua = navigator.userAgent
  // iPadOS reports a desktop UA; the touch-point check is the usual tell.
  const isIpad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1

  if (/iPhone|iPod/.test(ua) || isIpad) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Windows|Macintosh|Linux|CrOS/.test(ua)) return 'desktop'
  return 'other'
}

/**
 * Transcodes a video to 720p H.264 in a worker before upload, so the file that
 * reaches R2 is a fraction of what the applicant selected. This is what makes
 * long house-tour videos uploadable on mobile networks.
 */
export class CompressionCanceledError extends Error {
  constructor() {
    super('Otimização cancelada.')
    this.name = 'CompressionCanceledError'
  }
}

export function useVideoCompression() {
  const workerRef = useRef<Worker | null>(null)
  // Terminating the worker never resolves the in-flight promise, so the
  // rejector is kept here to settle it and avoid a stuck "compressing" state.
  const rejectRef = useRef<((error: Error) => void) | null>(null)

  const teardown = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    rejectRef.current = null
  }, [])

  const cancelCompression = useCallback(() => {
    const reject = rejectRef.current
    teardown()
    reject?.(new CompressionCanceledError())
  }, [teardown])

  useEffect(() => teardown, [teardown])

  const compressVideo = useCallback(
    (
      file: File,
      { onProgress }: CompressOptions = {}
    ): Promise<CompressionResult> => {
      teardown()

      const worker = new Worker(
        new URL('./video-compression.worker.ts', import.meta.url),
        { type: 'module' }
      )
      workerRef.current = worker
      const startedAt = performance.now()

      return new Promise<CompressionResult>((resolve, reject) => {
        rejectRef.current = reject

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const message = event.data

          if (message.type === 'progress') {
            onProgress?.(message.progress)
            return
          }

          if (message.type === 'error') {
            teardown()
            reject(new Error(message.message))
            return
          }

          const name = file.name.replace(/\.[^.]+$/, '')
          const compressed = new File(
            [message.buffer],
            `${name}-comprimido.mp4`,
            { type: 'video/mp4' }
          )
          teardown()
          resolve({
            file: compressed,
            diagnostics: {
              compressionMs: Math.round(performance.now() - startedAt),
              originalSizeBytes: file.size,
              originalWidth: message.sourceWidth,
              originalHeight: message.sourceHeight,
              hardwareConcurrency: navigator.hardwareConcurrency ?? null,
              platform: detectPlatform(),
            },
          })
        }

        worker.onerror = () => {
          teardown()
          reject(new Error('Não foi possível otimizar o vídeo.'))
        }

        worker.postMessage({ type: 'compress', file })
      })
    },
    [teardown]
  )

  return { compressVideo, cancelCompression }
}
