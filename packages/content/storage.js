import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cloneDefaultImageContent, defaultImageContent } from './defaults.js'

/**
 * @typedef {import('./types').HeroImageSet} HeroImageSet
 * @typedef {import('./types').ImageAsset} ImageAsset
 * @typedef {import('./types').ImageContent} ImageContent
 * @typedef {import('./types').PartialImageContent} PartialImageContent
 * @typedef {import('./types').SpotlightImage} SpotlightImage
 */

const dataFilePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'images.json')

/**
 * @returns {Promise<ImageContent>}
 */
export async function readImageContent() {
  try {
    const raw = await readFile(dataFilePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return sanitizeImageContent(parsed)
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException | undefined} */ (error)?.code === 'ENOENT') {
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

/**
 * @param {ImageContent} update
 * @returns {Promise<ImageContent>}
 */
export async function writeImageContent(update) {
  const sanitized = sanitizeImageContent(update)
  sanitized.updatedAt = new Date().toISOString()
  await writeFile(dataFilePath, JSON.stringify(sanitized, null, 2), 'utf-8')
  return sanitized
}

/**
 * @param {PartialImageContent} patch
 * @returns {Promise<ImageContent>}
 */
export async function applyImageContentPatch(patch) {
  const current = await readImageContent()
  const merged = mergeImageContent(current, patch)
  return writeImageContent(merged)
}

/**
 * @param {ImageContent} current
 * @param {PartialImageContent} patch
 * @returns {ImageContent}
 */
export function mergeImageContent(current, patch) {
  const next = {
    hero: mergeHero(current.hero, patch.hero),
    spotlights: mergeSpotlights(current.spotlights, patch.spotlights),
    gallery: mergeGallery(current.gallery, patch.gallery),
    updatedAt: new Date().toISOString()
  }
  return sanitizeImageContent(next)
}

/**
 * @param {unknown} candidate
 * @returns {ImageContent}
 */
export function sanitizeImageContent(candidate) {
  const fallback = cloneDefaultImageContent()
  if (!candidate || typeof candidate !== 'object') {
    return fallback
  }

  const hero = mergeHero(fallback.hero, Reflect.get(candidate, 'hero'))
  const spotlights = mergeSpotlights(fallback.spotlights, Reflect.get(candidate, 'spotlights'))
  const gallery = mergeGallery(fallback.gallery, Reflect.get(candidate, 'gallery'))
  const updatedCandidate = Reflect.get(candidate, 'updatedAt')

  return {
    hero,
    spotlights,
    gallery,
    updatedAt: typeof updatedCandidate === 'string' && isIsoDateString(updatedCandidate)
      ? updatedCandidate
      : new Date().toISOString()
  }
}

/**
 * @param {HeroImageSet} base
 * @param {HeroImageSet | null | undefined} value
 * @returns {HeroImageSet}
 */
function mergeHero(base, value) {
  const primary = sanitizeAsset(value?.primary ?? base.primary, base.primary, 'hero-primary')
  const secondaryRaw = value?.secondary ?? base.secondary ?? null
  const secondary = secondaryRaw ? sanitizeAsset(secondaryRaw, base.secondary ?? base.primary, 'hero-secondary', false) : null

  return {
    primary,
    secondary
  }
}

/**
 * @param {SpotlightImage[]} base
 * @param {SpotlightImage[] | null | undefined} value
 * @returns {SpotlightImage[]}
 */
function mergeSpotlights(base, value) {
  if (!Array.isArray(value) || value.length === 0) {
    return base.map((item, index) => sanitizeSpotlight(item, item, index))
  }

  return value.map((item, index) => {
    const fallback = base[index] ?? base[base.length - 1]
    return sanitizeSpotlight(item, fallback, index)
  })
}

/**
 * @param {ImageAsset[]} base
 * @param {ImageAsset[] | null | undefined} value
 * @returns {ImageAsset[]}
 */
function mergeGallery(base, value) {
  if (!Array.isArray(value) || value.length === 0) {
    return base.map((item, index) => sanitizeAsset(item, item, item.id ?? `gallery-${index}`))
  }

  return value.map((item, index) => {
    const fallback = base[index] ?? base[0]
    return sanitizeAsset(item, fallback, item?.id ?? `gallery-${index}`)
  })
}

/**
 * @param {SpotlightImage} candidate
 * @param {SpotlightImage} fallback
 * @param {number} index
 * @returns {SpotlightImage}
 */
function sanitizeSpotlight(candidate, fallback, index) {
  const sanitized = sanitizeAsset(candidate, fallback, candidate?.id ?? fallback?.id ?? `spotlight-${index}`)
  const description = typeof candidate?.description === 'string' && candidate.description.trim().length > 0
    ? candidate.description.trim()
    : fallback?.description ?? ''

  return {
    ...sanitized,
    id: sanitized.id ?? fallback?.id ?? `spotlight-${index}`,
    label: sanitized.label ?? fallback?.label ?? `Spotlight ${index + 1}`,
    description
  }
}

/**
 * @param {ImageAsset | null | undefined} candidate
 * @param {ImageAsset} fallback
 * @param {string} fallbackId
 * @param {boolean} [enforceUrl=true]
 * @returns {ImageAsset}
 */
function sanitizeAsset(candidate, fallback, fallbackId, enforceUrl = true) {
  const source = candidate ?? fallback
  const url = typeof source?.url === 'string' && source.url.trim().length > 0 ? source.url.trim() : fallback.url
  if (enforceUrl && !isLikelyUrl(url)) {
    throw new Error(`Image URL required for asset ${fallbackId}`)
  }

  const alt = typeof source?.alt === 'string' && source.alt.trim().length > 0 ? source.alt.trim() : fallback.alt
  if (!alt) {
    throw new Error(`Alt text required for asset ${fallbackId}`)
  }

  const label = typeof source?.label === 'string' && source.label.trim().length > 0 ? source.label.trim() : fallback.label
  const id = typeof source?.id === 'string' && source.id.trim().length > 0 ? source.id.trim() : fallbackId
  const credit = typeof source?.credit === 'string' && source.credit.trim().length > 0 ? source.credit.trim() : fallback.credit ?? null

  return { id, label, url, alt, credit }
}

function isIsoDateString(value) {
  if (!value) return false
  return !Number.isNaN(Date.parse(value))
}

function isLikelyUrl(value) {
  if (!value) return false
  try {
    const url = new URL(value, 'http://localhost')
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
