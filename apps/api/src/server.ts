import Fastify from 'fastify'
import cors from '@fastify/cors'
import type { FastifyCorsOptions } from '@fastify/cors'
import { applyImageContentPatch, readImageContent, sanitizeImageContent, writeImageContent } from '../../../shared/content/storage.js'
import type { ImageContent, PartialImageContent } from '../../../shared/content/types'

const PORT = Number.parseInt(process.env.PORT ?? '3333', 10)
const HOST = process.env.HOST ?? '0.0.0.0'

async function buildServer() {
  const server = Fastify({
    logger: {
      transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
    }
  })

  await server.register(cors, buildCorsOptions())

  server.get('/health', async () => ({ status: 'ok' }))

  server.get('/images', async () => {
    return readImageContent()
  })

  server.put<{ Body: ImageContent }>('/images', async (request, reply) => {
    try {
      const sanitized = sanitizeImageContent(request.body)
      const saved = await writeImageContent(sanitized)
      reply.code(200)
      return saved
    } catch (error: any) {
      request.log.error({ err: error }, 'Failed to write image content')
      reply.code(400)
      return {
        message: error?.message ?? 'Invalid payload'
      }
    }
  })

  server.patch<{ Body: PartialImageContent }>('/images', async (request, reply) => {
    try {
      const saved = await applyImageContentPatch(request.body)
      reply.code(200)
      return saved
    } catch (error: any) {
      request.log.error({ err: error }, 'Failed to patch image content')
      reply.code(400)
      return {
        message: error?.message ?? 'Invalid patch payload'
      }
    }
  })

  return server
}

function buildCorsOptions(): FastifyCorsOptions {
  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:3333',
    'http://localhost:4321',
    'http://localhost:5173',
    'http://127.0.0.1:4321',
    'http://127.0.0.1:5173',
    'tauri://localhost'
  ])

  return {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true)
        return
      }
      if (allowedOrigins.has(origin)) {
        cb(null, true)
        return
      }
      if (origin.startsWith('http://localhost:')) {
        cb(null, true)
        return
      }
      cb(new Error('Origin not allowed'), false)
    },
    methods: ['GET', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  }
}

async function start() {
  const server = await buildServer()
  try {
    await server.listen({ port: PORT, host: HOST })
    server.log.info(`Media content API running on http://${HOST}:${PORT}`)
  } catch (error) {
    server.log.error(error)
    process.exit(1)
  }
}

if (process.env.VITEST !== 'true') {
  start()
}

export type { ImageContent }
export { buildServer }
