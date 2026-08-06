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
    (file: File, { onProgress }: CompressOptions = {}): Promise<File> => {
      teardown()

      const worker = new Worker(
        new URL('./video-compression.worker.ts', import.meta.url),
        { type: 'module' }
      )
      workerRef.current = worker

      return new Promise<File>((resolve, reject) => {
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
          resolve(compressed)
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
