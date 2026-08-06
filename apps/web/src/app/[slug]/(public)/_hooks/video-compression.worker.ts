/// <reference lib="webworker" />

import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
} from 'mediabunny'

import {
  VIDEO_TARGET_AUDIO_BITRATE,
  VIDEO_TARGET_BITRATE,
  VIDEO_TARGET_MAX_EDGE,
} from './video-compression-config'

interface CompressRequest {
  type: 'compress'
  file: File
}

type WorkerRequest = CompressRequest | { type: 'cancel' }

export type WorkerResponse =
  | { type: 'progress'; progress: number }
  | { type: 'done'; buffer: ArrayBuffer }
  | { type: 'error'; message: string }

let activeConversion: Conversion | null = null

async function compress(file: File) {
  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  })

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  })

  const conversion = await Conversion.init({
    input,
    output,
    video: (track) => {
      // Scale the longest edge down to 720p, preserving orientation so a
      // portrait phone video stays portrait. Videos already smaller than the
      // target keep their dimensions.
      const longestEdge = Math.max(track.displayWidth, track.displayHeight)
      const scale = Math.min(1, VIDEO_TARGET_MAX_EDGE / longestEdge)

      return {
        width: Math.round((track.displayWidth * scale) / 2) * 2,
        height: Math.round((track.displayHeight * scale) / 2) * 2,
        fit: 'contain',
        codec: 'avc',
        // Must be the object form: `new Quality(n)` treats a bare number as a
        // qualitative level on a 0-1 scale, not as a bitrate. Constant mode
        // keeps the output size predictable, which is what the 80MB ceiling
        // depends on.
        quality: new Quality({
          bitrate: VIDEO_TARGET_BITRATE,
          bitrateMode: 'constant',
        }),
        forceTranscode: true,
      }
    },
    audio: {
      codec: 'aac',
      numberOfChannels: 1,
      quality: new Quality({ bitrate: VIDEO_TARGET_AUDIO_BITRATE }),
    },
  })

  activeConversion = conversion

  if (!conversion.isValid) {
    throw new Error(
      'Não foi possível processar este vídeo. Tente outro arquivo.'
    )
  }

  conversion.onProgress = (progress) => {
    post({ type: 'progress', progress: Math.round(progress * 100) })
  }

  await conversion.execute()

  const buffer = (output.target as BufferTarget).buffer
  if (!buffer) {
    throw new Error('Falha ao gerar o vídeo otimizado.')
  }

  return buffer
}

function post(message: WorkerResponse, transfer?: Transferable[]) {
  if (transfer) {
    self.postMessage(message, transfer)
  } else {
    self.postMessage(message)
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type === 'cancel') {
    await activeConversion?.cancel()
    activeConversion = null
    return
  }

  try {
    const buffer = await compress(event.data.file)
    post({ type: 'done', buffer }, [buffer])
  } catch (error) {
    post({
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível otimizar o vídeo.',
    })
  } finally {
    activeConversion = null
  }
}
