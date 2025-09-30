<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'

  export interface SpotlightSlide {
    id: string
    title: string
    description: string
    imageUrl: string
    imageAlt: string
    badge?: string
    action?: {
      type: string
      id?: string
      focusStep?: string
      selectId?: string
    }
  }

  const DEFAULT_INTERVAL = 6500

  export let title: string
  export let subtitle: string
  export let slides: SpotlightSlide[] = []
  export let accent: string = 'from-brand-pink/70 to-brand-teal/60'
  export let ctaLabel: string = 'Explore'
  export let auto: boolean = true
  export let interval: number = DEFAULT_INTERVAL
  export let triggerEventName: string | null = null

  const dispatch = createEventDispatcher<{ cta: SpotlightSlide }>()

  let activeIndex = 0
  let timer: ReturnType<typeof setInterval> | undefined

  const total = () => slides.length

  onMount(() => {
    if (auto && total() > 1) {
      startTimer()
    }
  })

  onDestroy(() => {
    stopTimer()
  })

  function startTimer() {
    stopTimer()
    timer = setInterval(() => {
      next()
    }, interval)
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
  }

  function next() {
    if (total() === 0) return
    activeIndex = (activeIndex + 1) % total()
  }

  function prev() {
    if (total() === 0) return
    activeIndex = (activeIndex - 1 + total()) % total()
  }

  function goTo(index: number) {
    if (total() === 0) return
    activeIndex = (index + total()) % total()
    if (auto) startTimer()
  }

  function handleCta() {
    if (!slides.length) return
    dispatch('cta', slides[activeIndex])
    if (auto) startTimer()
    if (triggerEventName && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(triggerEventName, { detail: slides[activeIndex].action ?? {} }))
    }
  }
</script>

<section class={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${accent} p-[1px] transition-transform duration-300 hover:scale-[1.01]`}>
  <div class="relative flex h-full flex-col justify-between rounded-[calc(theme(borderRadius.3xl)-1px)] bg-slate-950/80">
    <div class="p-6 sm:p-8">
      <p class="text-sm uppercase tracking-[0.3em] text-brand-teal/80">{subtitle}</p>
      <h3 class="mt-3 text-2xl font-semibold text-white sm:text-3xl">{title}</h3>
      {#if slides.length}
        <article class="mt-6 space-y-3">
          {#if slides[activeIndex].badge}
            <span class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              {slides[activeIndex].badge}
            </span>
          {/if}
          <h4 class="text-xl font-semibold text-white">{slides[activeIndex].title}</h4>
          <p class="text-sm leading-relaxed text-slate-300">{slides[activeIndex].description}</p>
        </article>
      {/if}
      <div class="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-brand-pink px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-pink/30 transition hover:bg-brand-pink/90"
          on:click={handleCta}
        >
          {ctaLabel}
          <span aria-hidden="true">→</span>
        </button>
        {#if slides.length > 1}
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/70 transition hover:border-white hover:text-white"
              on:click={() => {
                prev()
                if (auto) startTimer()
              }}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/70 transition hover:border-white hover:text-white"
              on:click={() => {
                next()
                if (auto) startTimer()
              }}
              aria-label="Next slide"
            >
              ›
            </button>
          </div>
        {/if}
      </div>
    </div>

    {#if slides.length}
      <figure class="relative h-64 overflow-hidden rounded-b-[calc(theme(borderRadius.3xl)-1px)]">
        <img
          src={slides[activeIndex].imageUrl}
          alt={slides[activeIndex].imageAlt}
          class="h-full w-full object-cover object-center transition duration-700"
        />
        {#if slides.length > 1}
          <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {#each slides as slide, idx}
              <button
                type="button"
                class={`h-2.5 rounded-full transition ${idx === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                aria-label={`Go to slide ${idx + 1}`}
                on:click={() => goTo(idx)}
              ></button>
            {/each}
          </div>
        {/if}
      </figure>
    {/if}
  </div>
</section>
