export interface ImageAsset {
  id?: string
  label?: string
  url: string
  alt: string
  credit?: string | null
}

export interface HeroImageSet {
  primary: ImageAsset
  secondary?: ImageAsset | null
}

export interface SpotlightImage extends ImageAsset {
  id: string
  label: string
  description?: string
}

export interface ImageContent {
  hero: HeroImageSet
  spotlights: SpotlightImage[]
  gallery: ImageAsset[]
  updatedAt: string
}

export type PartialImageContent = Partial<Pick<ImageContent, 'hero' | 'spotlights' | 'gallery'>>
