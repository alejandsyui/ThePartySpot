<script lang="ts">
  import { onMount } from 'svelte'
  import { invoke } from '@tauri-apps/api/tauri'
  import { cloneDefaultImageContent } from '@content/defaults'
  import type { HeroImageSet, ImageAsset, ImageContent, SpotlightImage } from '@content/types'

  const ownerName = 'Alexandra'

  const upcoming = [
    {
      id: 'bk-1203',
      title: 'Glow Night · Alvarez Sweet 16',
      start: 'Today · 5:30 PM',
      duration: '6 hrs',
      addons: ['DJ Booth', 'Neon Bar', 'Photo Booth'],
      status: 'In progress'
    },
    {
      id: 'bk-1204',
      title: 'Corporate Mixer · Nova Labs',
      start: 'Tomorrow · 3:00 PM',
      duration: '4 hrs',
      addons: ['Catering', 'A/V Crew'],
      status: 'Confirmed'
    }
  ]

  const kpis = [
    { label: 'Gross revenue (week)', value: '$18,420', trend: '+12.4%' },
    { label: 'Outstanding balances', value: '$2,190', trend: '3 invoices' },
    { label: 'Add-on attach rate', value: '78%', trend: '+6 pts' }
  ]

  const quickActions = [
    { label: 'New booking', hint: 'Ctrl + B' },
    { label: 'Add-on catalog', hint: 'Ctrl + A' },
    { label: 'Issue refund', hint: 'Ctrl + R' },
    { label: 'Content editor', hint: 'Ctrl + E' }
  ]

  const tasks = [
    { label: 'Approve refund · Booker #1198', owner: 'You', due: 'Today', type: 'finance' },
    { label: 'Publish “LED Infinity Wall” add-on', owner: 'Maya', due: 'Today', type: 'catalog' },
    { label: 'Upload photos from Taylor 30th', owner: 'Evan', due: 'Tomorrow', type: 'media' }
  ]

  let greeting = ''
  let content: ImageContent | null = null
  let isContentLoading = true
  let loadError = ''
  let isSaving = false
  let saveError = ''
  let saveTimestamp = ''
  let touched = false

  $: contentLastUpdated = content
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(content.updatedAt))
    : '—'

  onMount(async () => {
    try {
      greeting = await invoke('greet_owner', { name: ownerName })
    } catch (error) {
      console.error('Failed to call greet_owner command', error)
    }

    await loadImageContent()
  })

  async function openCalendar() {
    try {
      await invoke('open_calendar')
    } catch (error) {
      console.error('Unable to launch calendar', error)
    }
  }

  async function loadImageContent() {
    isContentLoading = true
    loadError = ''

    try {
  const raw = await invoke<Record<string, unknown>>('load_image_content')
      content = normalizeContent(raw)
      touched = false
      saveError = ''
    } catch (error) {
      console.error('Failed to load image content', error)
      loadError = error instanceof Error ? error.message : String(error)
      content = cloneDefaultImageContent()
    } finally {
      isContentLoading = false
    }
  }

  function normalizeContent(raw: Record<string, unknown> | undefined): ImageContent {
    const fallback = cloneDefaultImageContent()
    if (!raw) return fallback

    const heroSource = (raw as any)?.hero as Partial<HeroImageSet> | undefined
    const spotlightsSource = (raw as any)?.spotlights as SpotlightImage[] | undefined
    const gallerySource = (raw as any)?.gallery as ImageAsset[] | undefined
    const updatedAtSource = (raw as any)?.updatedAt

    const hero = coerceHero(heroSource, fallback.hero)
    const spotlights = coerceSpotlights(spotlightsSource, fallback.spotlights)
    const gallery = Array.isArray(gallerySource) ? gallerySource.map((asset) => coerceAsset(asset)) : fallback.gallery

    return {
      hero,
      spotlights,
      gallery,
      updatedAt: typeof updatedAtSource === 'string'
        ? (updatedAtSource as string)
        : fallback.updatedAt
    }
  }

  function coerceHero(candidate: Partial<HeroImageSet> | undefined, base: HeroImageSet): HeroImageSet {
    const primary = coerceAsset(candidate?.primary, base.primary, 'hero-primary')
    let secondary: ImageAsset | null = null

    if (candidate?.secondary) {
      secondary = coerceAsset(candidate.secondary, base.secondary ?? base.primary, 'hero-secondary')
    } else if (base.secondary) {
      secondary = base.secondary
    }

    return { primary, secondary: secondary ?? null }
  }

  function coerceSpotlights(candidate: SpotlightImage[] | undefined, base: SpotlightImage[]): SpotlightImage[] {
    if (!Array.isArray(candidate) || candidate.length === 0) {
      return base.map((item) => ({ ...item }))
    }

    return candidate.map((item, index) => ({
      ...base[index] ?? base[0],
      ...item,
      id: item.id ?? `spotlight-${index}`
    }))
  }

  function coerceAsset(candidate: Partial<ImageAsset> | undefined, base?: ImageAsset | null, fallbackId = `asset-${Date.now()}`): ImageAsset {
    const source = candidate ?? {}
    const baseAsset = base ?? {
      id: fallbackId,
      label: '',
      url: '',
      alt: '',
      credit: ''
    }

    return {
      id: source.id ?? baseAsset.id ?? fallbackId,
      label: source.label ?? baseAsset.label ?? '',
      url: source.url ?? baseAsset.url ?? '',
      alt: source.alt ?? baseAsset.alt ?? '',
      credit: source.credit ?? baseAsset.credit ?? ''
    }
  }

  function randomId(prefix: string): string {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`
      }
    } catch (error) {
      console.warn('randomUUID unavailable, falling back to timestamp id', error)
    }
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`
  }

  function createSpotlight(): SpotlightImage {
    return {
      id: randomId('spotlight'),
      label: 'New spotlight',
      description: '',
      url: '',
      alt: '',
      credit: ''
    }
  }

  function createGalleryAsset(): ImageAsset {
    return {
      id: randomId('gallery'),
      label: 'New gallery tile',
      url: '',
      alt: '',
      credit: ''
    }
  }

  function updateContent(mutator: (draft: ImageContent) => void) {
    if (!content) return
    const cloned = typeof structuredClone === 'function' ? structuredClone(content) : JSON.parse(JSON.stringify(content))
    mutator(cloned)
    content = cloned
    touched = true
    saveError = ''
  }

  function updateHero(part: 'primary' | 'secondary', key: keyof ImageAsset, value: string) {
    updateContent((draft) => {
      if (part === 'secondary' && !draft.hero.secondary) {
        draft.hero.secondary = {
          id: 'hero-secondary',
          label: 'Secondary hero',
          url: '',
          alt: '',
          credit: ''
        }
      }

      const target = part === 'primary' ? draft.hero.primary : draft.hero.secondary!
      target[key] = value
    })
  }

  function removeHeroSecondary() {
    updateContent((draft) => {
      draft.hero.secondary = null
    })
  }

  function updateSpotlight(index: number, key: keyof SpotlightImage | 'description', value: string) {
    updateContent((draft) => {
      const target = draft.spotlights[index]
      if (!target) return
      if (key === 'description') {
        target.description = value
      } else {
        target[key] = value
      }
    })
  }

  function addSpotlight() {
    updateContent((draft) => {
      draft.spotlights.push(createSpotlight())
    })
  }

  function removeSpotlight(index: number) {
    updateContent((draft) => {
      draft.spotlights.splice(index, 1)
    })
  }

  function updateGallery(index: number, key: keyof ImageAsset, value: string) {
    updateContent((draft) => {
      const target = draft.gallery[index]
      if (!target) return
      target[key] = value
    })
  }

  function addGallery() {
    updateContent((draft) => {
      draft.gallery.push(createGalleryAsset())
    })
  }

  function removeGallery(index: number) {
    updateContent((draft) => {
      draft.gallery.splice(index, 1)
    })
  }

  function promptForImage(callback: (value: string) => void, current: string) {
    if (typeof window === 'undefined') return
    const next = window.prompt('Paste a new image URL', current ?? '')
    if (next && next.trim().length > 0) {
      callback(next.trim())
    }
  }

  async function saveContent() {
    if (!content) return

    isSaving = true
    saveError = ''

    try {
      const payload = JSON.parse(JSON.stringify(content))
      const result = await invoke<Record<string, unknown>>('save_image_content', { content: payload })
      content = normalizeContent(result)
      touched = false
      saveTimestamp = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(content.updatedAt))
    } catch (error) {
      console.error('Unable to save image content', error)
      saveError = error instanceof Error ? error.message : String(error)
    } finally {
      isSaving = false
    }
  }

  function heroImages(hero: HeroImageSet | null) {
    if (!hero) return []
    return [hero.primary, ...(hero.secondary ? [hero.secondary] : [])]
  }
</script>

<div class="app-shell">
  <aside class="sidebar">
    <div class="sidebar__brand">
      <span class="sidebar__logo">🎉</span>
      <div>
        <p class="sidebar__title">The Party Spot</p>
        <p class="sidebar__subtitle">Control Center</p>
      </div>
    </div>
    <nav class="sidebar__nav">
      <button class="nav-item active">Dashboard</button>
      <button class="nav-item">Calendar</button>
      <button class="nav-item">Bookings</button>
      <button class="nav-item">Add-ons</button>
      <button class="nav-item">Content</button>
      <button class="nav-item">Payments</button>
      <button class="nav-item">Settings</button>
    </nav>
    <div class="sidebar__footer">
      <button class="secondary" on:click={openCalendar}>Launch Google Calendar</button>
    </div>
  </aside>

  <section class="content">
    <header class="hero">
      <div>
        <p class="hero__eyebrow">Admin overview</p>
        <h1 class="hero__title">{greeting || `Welcome back, ${ownerName}!`}</h1>
        <p class="hero__subtitle">
          Your bookings, pricing, content, and payouts are synced. Here’s what needs your attention right now.
        </p>
      </div>
      <div class="hero__actions">
        <button class="primary">Create booking</button>
        <button class="secondary">Add walk-in</button>
      </div>
    </header>

    <section class="grid kpi-grid">
      {#each kpis as item}
        <article class="card">
          <p class="card__label">{item.label}</p>
          <p class="card__value">{item.value}</p>
          <p class="card__hint">{item.trend}</p>
        </article>
      {/each}
    </section>

    <section class="grid split">
      <article class="card">
        <header class="card__header">
          <h2>Upcoming events</h2>
          <button class="ghost">View calendar</button>
        </header>
        <ul class="list">
          {#each upcoming as event}
            <li class="list__item">
              <div>
                <p class="list__title">{event.title}</p>
                <p class="list__meta">{event.start} • {event.duration}</p>
                <p class="list__addons">{event.addons.join(', ')}</p>
              </div>
              <span class={`status ${event.status === 'In progress' ? 'status--live' : ''}`}>{event.status}</span>
            </li>
          {/each}
        </ul>
      </article>
      <article class="card">
        <header class="card__header">
          <h2>Action list</h2>
          <button class="ghost">Open workflow</button>
        </header>
        <ul class="list">
          {#each tasks as task}
            <li class="list__item">
              <div>
                <p class="list__title">{task.label}</p>
                <p class="list__meta">Owner: {task.owner} • Due {task.due}</p>
              </div>
              <span class={`tag tag--${task.type}`}>{task.type}</span>
            </li>
          {/each}
        </ul>
      </article>
    </section>

    <section class="grid quick-actions">
      <article class="card">
        <header class="card__header">
          <h2>Quick actions</h2>
          <p class="card__hint">Launch common workflows without leaving the dashboard.</p>
        </header>
        <div class="actions-grid">
          {#each quickActions as action}
            <button class="action-chip">
              <span>{action.label}</span>
              <kbd>{action.hint}</kbd>
            </button>
          {/each}
        </div>
      </article>
      <article class="card">
        <header class="card__header">
          <h2>Live sync</h2>
        </header>
        <p class="card__hint">
          Booking calendar, website, and desktop clients share one Supabase realtime channel. Drag-and-drop updates will publish to the site instantly and notify staff over email/SMS.
        </p>
        <ul class="sync-list">
          <li><span class="dot dot--ok"></span> Website availability updated 2 minutes ago.</li>
          <li><span class="dot dot--ok"></span> Stripe payouts reconciled.</li>
          <li><span class="dot dot--warning"></span> Reminder: configure new add-on images.</li>
        </ul>
      </article>
    </section>

    <section class="content-editor">
      <article class="card card--stacked">
        <header class="card__header card__header--split">
          <div>
            <h2>Website content manager</h2>
            <p class="card__hint">Synced {contentLastUpdated}</p>
          </div>
          <div class="card__actions">
            <button class="ghost" type="button" on:click={loadImageContent} disabled={isContentLoading || isSaving}>Refresh</button>
            <button class="primary" type="button" on:click={saveContent} disabled={!content || isSaving || !touched}>Save changes</button>
          </div>
        </header>

        {#if isContentLoading}
          <p class="loading-text">Loading content library…</p>
        {:else if loadError}
          <p class="error-text">{loadError}</p>
        {:else if content}
          <div class="editor-section">
            <h3>Hero imagery</h3>
            <div class="media-grid">
              {#each heroImages(content.hero) as image, index (image.id)}
                <div class="form-panel">
                  <header class="form-panel__header">
                    <div>
                      <p class="panel-eyebrow">{index === 0 ? 'Primary' : 'Secondary'}</p>
                      <p class="panel-title">{image.label || 'Untitled image'}</p>
                    </div>
                    <div class="panel-actions">
                      <button
                        class="chip-button"
                        type="button"
                        on:click={() => promptForImage((url) => updateHero(index === 0 ? 'primary' : 'secondary', 'url', url), image.url)}
                      >
                        Replace image
                      </button>
                      {#if index === 1}
                        <button class="chip-button" type="button" on:click={removeHeroSecondary}>Remove</button>
                      {/if}
                    </div>
                  </header>
                  <div class="media-card preview">
                    <img src={image.url} alt={image.alt} loading="lazy" />
                  </div>
                  <div class="form-grid">
                    <label class="field">
                      <span class="field__label">Label</span>
                      <input
                        class="text-input"
                        placeholder="Immersive LED Wall"
                        value={image.label}
                        on:input={(event) => updateHero(index === 0 ? 'primary' : 'secondary', 'label', event.currentTarget.value)}
                      />
                    </label>
                    <label class="field">
                      <span class="field__label">Alt text</span>
                      <input
                        class="text-input"
                        placeholder="Describe the image for accessibility"
                        value={image.alt}
                        on:input={(event) => updateHero(index === 0 ? 'primary' : 'secondary', 'alt', event.currentTarget.value)}
                      />
                    </label>
                    <label class="field">
                      <span class="field__label">Credit</span>
                      <input
                        class="text-input"
                        placeholder="Photography credit"
                        value={image.credit ?? ''}
                        on:input={(event) => updateHero(index === 0 ? 'primary' : 'secondary', 'credit', event.currentTarget.value)}
                      />
                    </label>
                  </div>
                </div>
              {/each}
              {#if !content.hero.secondary}
                <button class="add-tile" type="button" on:click={() => updateHero('secondary', 'label', 'Secondary hero image')}>
                  <span>＋</span>
                  <p>Add secondary hero image</p>
                </button>
              {/if}
            </div>
          </div>

          <div class="editor-section">
            <div class="section-header">
              <h3>Homepage spotlights</h3>
              <button class="ghost" type="button" on:click={addSpotlight}>Add spotlight</button>
            </div>
            <ul class="spotlight-list spotlight-list--editable">
              {#each content.spotlights as spotlight, index (spotlight.id)}
                <li class="spotlight-list__item">
                  <div class="spotlight-preview">
                    <img src={spotlight.url} alt={spotlight.alt} loading="lazy" />
                    <button class="chip-button" type="button" on:click={() => promptForImage((url) => updateSpotlight(index, 'url', url), spotlight.url)}>Replace image</button>
                  </div>
                  <div class="spotlight-form">
                    <div class="spotlight-form__row">
                      <label class="field">
                        <span class="field__label">Label</span>
                        <input
                          class="text-input"
                          placeholder="Glow Night"
                          value={spotlight.label}
                          on:input={(event) => updateSpotlight(index, 'label', event.currentTarget.value)}
                        />
                      </label>
                      <button class="chip-button" type="button" on:click={() => removeSpotlight(index)}>Remove</button>
                    </div>
                    <label class="field">
                      <span class="field__label">Description</span>
                      <textarea
                        class="text-area"
                        rows="3"
                        placeholder="What does this spotlight highlight?"
                        value={spotlight.description ?? ''}
                        on:input={(event) => updateSpotlight(index, 'description', event.currentTarget.value)}
                      ></textarea>
                    </label>
                    <div class="form-grid">
                      <label class="field">
                        <span class="field__label">Alt text</span>
                        <input
                          class="text-input"
                          placeholder="Accessible description"
                          value={spotlight.alt}
                          on:input={(event) => updateSpotlight(index, 'alt', event.currentTarget.value)}
                        />
                      </label>
                      <label class="field">
                        <span class="field__label">Credit</span>
                        <input
                          class="text-input"
                          placeholder="Photography credit"
                          value={spotlight.credit ?? ''}
                          on:input={(event) => updateSpotlight(index, 'credit', event.currentTarget.value)}
                        />
                      </label>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          </div>

          <div class="editor-section">
            <div class="section-header">
              <h3>Gallery rotation</h3>
              <button class="ghost" type="button" on:click={addGallery}>Add gallery tile</button>
            </div>
            <div class="media-grid media-grid--compact">
              {#each content.gallery as asset, index (asset.id)}
                <div class="form-panel">
                  <header class="form-panel__header">
                    <div>
                      <p class="panel-title">{asset.label || 'Gallery asset'}</p>
                      <p class="panel-eyebrow">{asset.id}</p>
                    </div>
                    <div class="panel-actions">
                      <button class="chip-button" type="button" on:click={() => promptForImage((url) => updateGallery(index, 'url', url), asset.url)}>Replace image</button>
                      <button class="chip-button" type="button" on:click={() => removeGallery(index)}>Remove</button>
                    </div>
                  </header>
                  <div class="media-card preview">
                    <img src={asset.url} alt={asset.alt} loading="lazy" />
                  </div>
                  <div class="form-grid">
                    <label class="field">
                      <span class="field__label">Label</span>
                      <input
                        class="text-input"
                        placeholder="Gallery tile name"
                        value={asset.label ?? ''}
                        on:input={(event) => updateGallery(index, 'label', event.currentTarget.value)}
                      />
                    </label>
                    <label class="field">
                      <span class="field__label">Alt text</span>
                      <input
                        class="text-input"
                        placeholder="Accessible description"
                        value={asset.alt}
                        on:input={(event) => updateGallery(index, 'alt', event.currentTarget.value)}
                      />
                    </label>
                    <label class="field">
                      <span class="field__label">Credit</span>
                      <input
                        class="text-input"
                        placeholder="Photography credit"
                        value={asset.credit ?? ''}
                        on:input={(event) => updateGallery(index, 'credit', event.currentTarget.value)}
                      />
                    </label>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <footer class="editor-footer">
            <div class="editor-status">
              {#if saveError}
                <span class="editor-status__icon editor-status__icon--error">⚠️</span>
                <span class="editor-status__message">{saveError}</span>
              {:else if isSaving}
                <span class="editor-status__icon">⏳</span>
                <span class="editor-status__message">Saving changes…</span>
              {:else if saveTimestamp}
                <span class="editor-status__icon editor-status__icon--success">✅</span>
                <span class="editor-status__message">Saved {saveTimestamp}</span>
              {:else if touched}
                <span class="editor-status__icon">💾</span>
                <span class="editor-status__message">You have unsaved changes.</span>
              {/if}
            </div>
            <button class="primary" type="button" on:click={saveContent} disabled={!content || isSaving || !touched}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </footer>
        {/if}
      </article>
    </section>
  </section>
</div>
