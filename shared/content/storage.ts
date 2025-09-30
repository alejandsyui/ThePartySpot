import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HeroImageSet, ImageAsset, ImageContent, PartialImageContent, SpotlightImage } from './types'
import { cloneDefaultImageContent, defaultImageContent } from './defaults'

const dataFilePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'images.json')

export async function readImageContent(): Promise<ImageContent> {
  try {
    const raw = await readFile(dataFilePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return sanitizeImageContent(parsed)
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      const fallback = cloneDefaultImageContent()
      await writeFile(dataFilePath, JSON.stringify(fallback, null, 2), 'utf-8')
      return fallback
    }
    if (error instanceof SyntaxError) {
      return cloneDefaultImageContent()
    }
    throw error
  }
}

export async function writeImageContent(update: ImageContent): Promise<ImageContent> {
  const sanitized = sanitizeImageContent(update)
  sanitized.updatedAt = new Date().toISOString()
  await writeFile(dataFilePath, JSON.stringify(sanitized, null, 2), 'utf-8')
  return sanitized
}

export async function applyImageContentPatch(patch: PartialImageContent): Promise<ImageContent> {
  const current = await readImageContent()
  const merged = mergeImageContent(current, patch)
  return writeImageContent(merged)
}

export function mergeImageContent(current: ImageContent, patch: PartialImageContent): ImageContent {
  const next: ImageContent = {
    hero: mergeHero(current.hero, patch.hero),
    spotlights: mergeSpotlights(current.spotlights, patch.spotlights),
    gallery: mergeGallery(current.gallery, patch.gallery),
    updatedAt: new Date().toISOString()
  }
  return sanitizeImageContent(next)
}

export function sanitizeImageContent(candidate: unknown): ImageContent {
  const fallback = cloneDefaultImageContent()
  if (!candidate || typeof candidate !== 'object') {
    return fallback
  }

  const hero = mergeHero(fallback.hero, (candidate as any).hero)
  const spotlights = mergeSpotlights(fallback.spotlights, (candidate as any).spotlights)
  const gallery = mergeGallery(fallback.gallery, (candidate as any).gallery)

  const updatedAtCandidate = typeof (candidate as any).updatedAt === 'string' ? (candidate as any).updatedAt : fallback.updatedAt

  return {
    hero,
    spotlights,
    gallery,
    updatedAt: isIsoDateString(updatedAtCandidate) ? updatedAtCandidate : new Date().toISOString()
  }
}

function mergeHero(base: HeroImageSet, value?: HeroImageSet | null): HeroImageSet {
  const primary = sanitizeAsset(value?.primary ?? base.primary, base.primary, 'hero-primary')
  const secondaryRaw = value?.secondary ?? base.secondary ?? null
  const secondary = secondaryRaw ? sanitizeAsset(secondaryRaw, base.secondary ?? base.primary, 'hero-secondary', false) : null

  return {
    primary,
    secondary
  }
}

function mergeSpotlights(base: SpotlightImage[], value?: SpotlightImage[] | null): SpotlightImage[] {
  if (!Array.isArray(value) || value.length === 0) {
    return base.map((item) => sanitizeSpotlight(item, item))
  }

  return value.map((item, index) => {
    const fallback = base[index] ?? base[base.length - 1]
    return sanitizeSpotlight(item, fallback, index)
  })
}

function mergeGallery(base: ImageAsset[], value?: ImageAsset[] | null): ImageAsset[] {
  if (!Array.isArray(value) || value.length === 0) {
    return base.map((item, index) => sanitizeAsset(item, item, `gallery-${index}`))
  }

  return value.map((item, index) => {
    const fallback = base[index] ?? base[0]
    return sanitizeAsset(item, fallback, item.id ?? `gallery-${index}`)
  })
}

function sanitizeSpotlight(candidate: SpotlightImage, fallback: SpotlightImage, index?: number): SpotlightImage {
  const sanitized = sanitizeAsset(candidate, fallback, candidate?.id ?? fallback.id ?? `spotlight-${index ?? 0}`)
  const description = typeof candidate.description === 'string' && candidate.description.trim().length > 0 ? candidate.description.trim() : fallback.description ?? ''
  return {
    ...sanitized,
    id: sanitized.id ?? fallback.id ?? `spotlight-${index ?? 0}`,
    label: sanitized.label ?? fallback.label ?? `Spotlight ${index ?? 1}`,
    description
  }
}

function sanitizeAsset(candidate: ImageAsset | null | undefined, fallback: ImageAsset, fallbackId: string, enforceUrl = true): ImageAsset {
  const source = candidate ?? fallback
  const url = typeof source.url === 'string' && source.url.trim().length > 0 ? source.url.trim() : fallback.url
  if (enforceUrl && !isLikelyUrl(url)) {
    throw new Error(`Image URL required for asset ${fallbackId}`)
  }

  const alt = typeof source.alt === 'string' && source.alt.trim().length > 0 ? source.alt.trim() : fallback.alt
  if (!alt) {
    throw new Error(`Alt text required for asset ${fallbackId}`)
  }

  const label = typeof source.label === 'string' && source.label.trim().length > 0 ? source.label.trim() : fallback.label
  const id = typeof source.id === 'string' && source.id.trim().length > 0 ? source.id.trim() : fallbackId
  const credit = typeof source.credit === 'string' && source.credit.trim().length > 0 ? source.credit.trim() : fallback.credit ?? null

  return { id, label, url, alt, credit }
}

function isIsoDateString(value: string): boolean {
  if (!value) return false
  return !Number.isNaN(Date.parse(value))
}

function isLikelyUrl(value: string): boolean {
  if (!value) return false
  try {
    const url = new URL(value, 'http://localhost')
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
