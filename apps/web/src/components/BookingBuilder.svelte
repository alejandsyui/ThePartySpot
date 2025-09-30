<script lang="ts">
  import { onMount } from 'svelte'
  import { fade, fly, scale } from 'svelte/transition'

  export type BookingOpenDetail = {
    focusStep?: 'decor' | 'addons' | 'schedule'
    selectId?: string
  }

  export let buttonLabel = 'Plan your event'
  export let variant: 'primary' | 'ghost' | 'soft' = 'primary'
  export let showButton = true
  export let triggerEventName = 'booking:open'

  const baseEventPrice = 350

  interface DecorOption {
    id: string
    label: string
    description: string
    price: number
    imageUrl: string
  }

  interface AddOnOption {
    id: string
    label: string
    description: string
    category: 'service' | 'experience' | 'facility'
    price: number
  }

  interface ExperienceOption {
    id: string
    label: string
    description: string
    price: number
  }

  const decorOptions: DecorOption[] = [
    {
      id: 'dora-adventure',
      label: 'Dora Explorer Adventure',
      description: 'Vibrant rainforest set, explorer props, custom photo wall.',
      price: 480,
      imageUrl: 'https://images.unsplash.com/photo-1603573355603-55c6733d94d4?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'paw-patrol-rescue',
      label: 'Paw Patrol Rescue HQ',
      description: 'Full PAW Patrol prop set, lookout tower backdrop, rescue mission activities.',
      price: 520,
      imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'neon-nightlife',
      label: 'Neon Nightlife',
      description: 'Glow tunnel entrance, LED dancefloor, UV reactive decor elements.',
      price: 650,
      imageUrl: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'gala-luxe',
      label: 'Gala Luxe',
      description: 'Premium florals, mirrored centerpieces, champagne walls for corporate or weddings.',
      price: 780,
      imageUrl: 'https://images.unsplash.com/photo-1525807227064-4f6c70e15c50?auto=format&fit=crop&w=900&q=80'
    }
  ]

  const addOnOptions: AddOnOption[] = [
    {
      id: 'vip-security',
      label: 'Security team',
      description: 'Licensed guards for entry management and VIP escort.',
      category: 'service',
      price: 220
    },
    {
      id: 'craft-minibar',
      label: 'Craft minibar',
      description: 'Two bartenders, curated cocktail menu, zero-proof options.',
      category: 'service',
      price: 320
    },
    {
      id: 'photo-booth',
      label: '360° photo booth',
      description: 'Shareable slow-motion videos, on-site attendant, custom graphics.',
      category: 'experience',
      price: 260
    },
    {
      id: 'dj-talent',
      label: 'Resident DJ',
      description: '4-hour set, intelligent lighting sync, custom playlist curation.',
      category: 'experience',
      price: 400
    },
    {
      id: 'signature-catering',
      label: 'Signature catering',
      description: 'Chef-led grazing stations and dessert towers for 80 guests.',
      category: 'facility',
      price: 540
    },
    {
      id: 'aftercare-cleanup',
      label: 'After-hours cleanup crew',
      description: 'Full reset within 90 minutes post-event with waste haul-away.',
      category: 'facility',
      price: 180
    }
  ]

  const experienceOptions: ExperienceOption[] = [
    {
      id: 'kids-birthday',
      label: 'Kids Birthday Magic',
      description: 'Balloon garlands, themed cake table, party host staff.',
      price: 210
    },
    {
      id: 'corporate-lounge',
      label: 'Corporate Lounge',
      description: 'Fireside chats, lounge vignettes, brandable content zones.',
      price: 260
    },
    {
      id: 'neon-glow',
      label: 'Neon Glow Night',
      description: 'Club lighting, live VJ, glow swag bundles for guests.',
      price: 290
    }
  ]

  const socialProviders = [
    { id: 'google', label: 'Continue with Google', icon: 'G' },
    { id: 'apple', label: 'Continue with Apple', icon: '' },
    { id: 'facebook', label: 'Continue with Facebook', icon: 'f' },
    { id: 'microsoft', label: 'Continue with Microsoft', icon: '◆' },
    { id: 'linkedin', label: 'Continue with LinkedIn', icon: 'in' }
  ]

  let isOpen = false
  let step = 0
  let selectedDate = ''
  let startTime = '18:00'
  let durationHours = 4
  let guestCount = 50
  let decorId: string | null = null
  let addOnIds: Set<string> = new Set()
  let experienceId: string | null = 'kids-birthday'
  let hostName = ''
  let hostEmail = ''
  let specialNotes = ''

  const steps = ['Schedule', 'Decor', 'Add-ons', 'Summary', 'Create account']

  onMount(() => {
    if (typeof window === 'undefined') return
    const handler = handleExternalOpen as EventListener
    window.addEventListener(triggerEventName, handler)
    return () => {
      window.removeEventListener(triggerEventName, handler)
    }
  })

  function open(detail?: BookingOpenDetail) {
    isOpen = true
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
    if (detail?.focusStep === 'decor') {
      step = 1
      if (detail.selectId) {
        decorId = detail.selectId
      }
    } else if (detail?.focusStep === 'addons') {
      step = 2
      if (detail.selectId) {
        addOnIds.add(detail.selectId)
      }
    } else if (detail?.focusStep === 'schedule') {
      step = 0
      if (detail.selectId) {
        experienceId = detail.selectId
      }
    }
  }

  function close() {
    isOpen = false
    step = 0
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
  }

  function handleExternalOpen(event: CustomEvent<BookingOpenDetail>) {
    open(event.detail)
  }

  function toggleAddon(id: string) {
    const next = new Set(addOnIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    addOnIds = next
  }

  $: decorPrice = decorOptions.find((item) => item.id === decorId)?.price ?? 0
  $: addOnPrice = Array.from(addOnIds).reduce((sum, id) => {
    const addon = addOnOptions.find((item) => item.id === id)
    return sum + (addon?.price ?? 0)
  }, 0)
  $: experiencePrice = experienceOptions.find((item) => item.id === experienceId)?.price ?? 0
  $: headcountFee = Math.max(0, guestCount - 60) * 4
  $: estimatedTotal = baseEventPrice + decorPrice + addOnPrice + experiencePrice + headcountFee

  function goNext() {
    if (step < steps.length - 1) {
      step += 1
    }
  }

  function goBack() {
    if (step > 0) {
      step -= 1
    }
  }

  function reset() {
    close()
    selectedDate = ''
    startTime = '18:00'
    durationHours = 4
    guestCount = 50
    decorId = null
    addOnIds = new Set()
    experienceId = 'kids-birthday'
    hostName = ''
    hostEmail = ''
    specialNotes = ''
  }

  function fakeSubmit() {
    // Placeholder submission logic
    console.info('Submitting booking intent', {
      selectedDate,
      startTime,
      durationHours,
      guestCount,
      decorId,
      addOnIds: Array.from(addOnIds),
      experienceId,
      hostName,
      hostEmail,
      specialNotes,
      estimatedTotal
    })
    reset()
  }

  function buttonClasses() {
    switch (variant) {
      case 'ghost':
        return 'inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white'
      case 'soft':
        return 'inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20'
      default:
        return 'inline-flex items-center gap-2 rounded-full bg-brand-pink px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-pink/30 transition hover:bg-brand-pink/90'
    }
  }
</script>

{#if showButton}
  <button type="button" class={buttonClasses()} on:click={() => open()}>
    {buttonLabel}
  </button>
{/if}

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur" transition:fade>
    <div class="relative w-full max-w-4xl rounded-t-3xl border-t border-white/10 bg-slate-950/95 shadow-2xl shadow-brand-teal/20 sm:my-12 sm:h-auto sm:rounded-3xl sm:border sm:border-white/10" transition:fly={{ y: 24, duration: 200 }}>
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5 sm:px-10">
        <div>
          <p class="text-xs uppercase tracking-[0.4em] text-brand-teal/60">Build your celebration</p>
          <h2 class="text-xl font-semibold text-white sm:text-2xl">Interactive booking preview</h2>
        </div>
        <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
          <span>Step {step + 1}</span>
          <span class="text-slate-600">/</span>
          <span>{steps.length}</span>
        </div>
        <button
          type="button"
          class="absolute right-6 top-5 text-slate-500 transition hover:text-white sm:right-8 sm:top-6"
          on:click={close}
          aria-label="Close booking builder"
        >
          ✕
        </button>
      </header>

      <div class="grid gap-6 px-6 py-6 sm:grid-cols-[1.8fr_1fr] sm:px-10 sm:py-8">
        <section class="space-y-6">
          {#if step === 0}
            <div class="space-y-4" transition:fade>
              <h3 class="text-lg font-semibold text-white">Pick your date and schedule</h3>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="flex flex-col gap-2 text-sm text-slate-200">
                  Event date
                  <input
                    type="date"
                    bind:value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-teal"
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-200">
                  Start time
                  <input
                    type="time"
                    bind:value={startTime}
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-teal"
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-200">
                  Duration (hours)
                  <input
                    type="number"
                    min="2"
                    max="12"
                    bind:value={durationHours}
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-teal"
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-200">
                  Guest count
                  <input
                    type="number"
                    min="10"
                    max="300"
                    bind:value={guestCount}
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-teal"
                  />
                </label>
              </div>
              <p class="text-xs text-slate-400">
                We reserve a 60-guest base. Additional guests add $4 each to cover staffing and reset time.
              </p>
            </div>
          {:else if step === 1}
            <div class="space-y-4" transition:fade>
              <div class="flex items-center justify-between text-white">
                <h3 class="text-lg font-semibold">Choose a décor storyline</h3>
                <span class="text-xs uppercase tracking-wide text-brand-teal/70">{decorOptions.length} options</span>
              </div>
              <div class="grid gap-4">
                {#each decorOptions as option}
                  <label class={`flex gap-4 rounded-2xl border border-white/${decorId === option.id ? '30' : '10'} bg-white/5 p-4 transition hover:border-brand-teal/60`}>
                    <input
                      class="mt-1.5 h-4 w-4 flex-shrink-0 accent-brand-pink"
                      type="radio"
                      name="decor"
                      value={option.id}
                      checked={decorId === option.id}
                      on:change={() => (decorId = option.id)}
                    />
                    <div class="flex flex-1 flex-col gap-3">
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p class="text-base font-semibold text-white">{option.label}</p>
                          <p class="text-xs uppercase tracking-wide text-brand-teal/70">Includes on-site stylists</p>
                        </div>
                        <span class="rounded-full bg-brand-pink/20 px-4 py-1 text-sm font-semibold text-brand-pink">+${option.price}</span>
                      </div>
                      <p class="text-sm leading-relaxed text-slate-300">{option.description}</p>
                      <img src={option.imageUrl} alt={option.label} class="h-40 w-full rounded-xl object-cover" />
                    </div>
                  </label>
                {/each}
              </div>
            </div>
          {:else if step === 2}
            <div class="space-y-4" transition:fade>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h3 class="text-lg font-semibold text-white">Select add-ons & staffing</h3>
                <p class="text-xs text-slate-400">Tap to include. Mix and match.</p>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                {#each addOnOptions as addon}
                  <button
                    type="button"
                    class={`group flex h-full flex-col justify-between rounded-2xl border ${addOnIds.has(addon.id) ? 'border-brand-teal bg-brand-teal/15' : 'border-white/10 bg-white/5'} p-5 text-left transition hover:border-brand-teal/70`}
                    on:click={() => toggleAddon(addon.id)}
                  >
                    <div class="space-y-3">
                      <div class="flex items-center justify-between gap-3">
                        <h4 class="text-base font-semibold text-white">{addon.label}</h4>
                        <span class="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-brand-teal/80">{addon.category}</span>
                      </div>
                      <p class="text-sm text-slate-300">{addon.description}</p>
                    </div>
                    <span class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-pink">
                      {addOnIds.has(addon.id) ? 'Added' : 'Add'}
                      <span class="text-white/60">·</span>
                      ${addon.price}
                    </span>
                  </button>
                {/each}
              </div>
            </div>
          {:else if step === 3}
            <div class="space-y-5" transition:fade>
              <h3 class="text-lg font-semibold text-white">Preview & guest details</h3>
              <div class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div class="flex justify-between text-sm text-slate-200">
                  <span>Base venue package</span>
                  <span>${baseEventPrice}</span>
                </div>
                <div class="flex justify-between text-sm text-slate-200">
                  <span>Décor storyline</span>
                  <span>{decorPrice ? `$${decorPrice}` : 'Included (select option)'}</span>
                </div>
                <div class="flex justify-between text-sm text-slate-200">
                  <span>Add-ons ({addOnIds.size})</span>
                  <span>${addOnPrice}</span>
                </div>
                <div class="flex justify-between text-sm text-slate-200">
                  <span>Experience overlay</span>
                  <span>${experiencePrice}</span>
                </div>
                <div class="flex justify-between text-sm text-slate-200">
                  <span>Headcount buffer</span>
                  <span>${headcountFee}</span>
                </div>
                <div class="border-t border-white/10 pt-3 text-base font-semibold text-white">
                  <div class="flex justify-between">
                    <span>Estimated total</span>
                    <span>${estimatedTotal}</span>
                  </div>
                </div>
              </div>

              <label class="flex flex-col gap-2 text-sm text-slate-200">
                Select experience vibe
                <select
                  bind:value={experienceId}
                  class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-teal"
                >
                  {#each experienceOptions as option}
                    <option value={option.id}>
                      {option.label} (+${option.price})
                    </option>
                  {/each}
                </select>
              </label>

              <div class="grid gap-4 sm:grid-cols-2">
                <label class="flex flex-col gap-2 text-sm text-slate-200">
                  Host name
                  <input
                    type="text"
                    bind:value={hostName}
                    placeholder="Alexandra Cruz"
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-teal"
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-200">
                  Contact email
                  <input
                    type="email"
                    bind:value={hostEmail}
                    placeholder="you@example.com"
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-teal"
                  />
                </label>
                <label class="sm:col-span-2 flex flex-col gap-2 text-sm text-slate-200">
                  Special requests
                  <textarea
                    bind:value={specialNotes}
                    rows="3"
                    placeholder="Tell us about your must-haves, VIPs, or timing notes."
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-teal"
                  ></textarea>
                </label>
              </div>
            </div>
          {:else if step === 4}
            <div class="space-y-5" transition:fade>
              <h3 class="text-lg font-semibold text-white">Create your account to lock it in</h3>
              <p class="text-sm text-slate-300">
                Finish with one tap. We save your selections, generate contracts, and prep the payment portal.
              </p>
              <div class="grid gap-3 sm:grid-cols-2">
                {#each socialProviders as provider}
                  <button
                    type="button"
                    class="flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 text-sm font-semibold text-white transition hover:border-brand-teal/60 hover:bg-brand-teal/20"
                    on:click={fakeSubmit}
                  >
                    <span class="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-base">{provider.icon}</span>
                    {provider.label}
                  </button>
                {/each}
              </div>
              <div class="relative">
                <div class="absolute inset-0 flex items-center"><span class="w-full border-t border-white/10"></span></div>
                <div class="relative flex justify-center text-xs uppercase tracking-[0.4em] text-slate-500">
                  <span class="bg-slate-950 px-3">or email</span>
                </div>
              </div>
              <form class="space-y-3" on:submit|preventDefault={fakeSubmit}>
                <label class="flex flex-col gap-2 text-sm text-slate-200">
                  Email address
                  <input
                    type="email"
                    bind:value={hostEmail}
                    required
                    placeholder="you@example.com"
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-teal"
                  />
                </label>
                <label class="flex flex-col gap-2 text-sm text-slate-200">
                  Create password
                  <input
                    type="password"
                    minlength="8"
                    placeholder="••••••••"
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-teal"
                  />
                </label>
                <div class="flex items-center gap-2 text-xs text-slate-400">
                  <input type="checkbox" class="h-4 w-4 rounded border border-white/20 bg-slate-900" required />
                  <span>I agree to receive booking updates via SMS/email.</span>
                </div>
                <button
                  type="submit"
                  class="w-full rounded-full bg-brand-pink py-3 text-sm font-semibold text-white shadow-lg shadow-brand-pink/30 transition hover:bg-brand-pink/90"
                >
                  Finish account & continue to payment
                </button>
              </form>
            </div>
          {/if}

          <div class="flex flex-wrap items-center gap-2 pt-2 text-xs uppercase tracking-wide text-slate-500">
            {#each steps as label, idx}
              <span class={`flex items-center gap-2 ${idx === step ? 'text-white' : ''}`}>
                <span class={`h-2 w-2 rounded-full ${idx <= step ? 'bg-brand-teal' : 'bg-white/20'}`}></span>
                {label}
              </span>
              {#if idx < steps.length - 1}
                <span class="text-slate-700">→</span>
              {/if}
            {/each}
          </div>
        </section>

        <aside class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div class="space-y-2">
            <p class="text-xs uppercase tracking-[0.4em] text-brand-teal/70">Live summary</p>
            <h4 class="text-xl font-semibold text-white">${estimatedTotal}</h4>
            <p class="text-xs text-slate-400">Deposit due today: ${(estimatedTotal * 0.25).toFixed(0)}</p>
          </div>
          <ul class="space-y-3 text-sm text-slate-200">
            <li class="flex items-start gap-2">
              <span class="mt-0.5 text-brand-teal">●</span>
              {selectedDate ? `Requested ${selectedDate} at ${startTime}` : 'Choose your date to begin'}
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-0.5 text-brand-teal">●</span>
              {decorId ? `${decorOptions.find((item) => item.id === decorId)?.label} décor` : 'Select a décor storyline'}
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-0.5 text-brand-teal">●</span>
              {addOnIds.size > 0 ? `${addOnIds.size} add-on${addOnIds.size > 1 ? 's' : ''} locked` : 'Pick staffing or premium add-ons'}
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-0.5 text-brand-teal">●</span>
              {experienceOptions.find((item) => item.id === experienceId)?.label}
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-0.5 text-brand-teal">●</span>
              Estimated headcount {guestCount} guests
            </li>
          </ul>

          <div class="rounded-2xl border border-white/15 bg-slate-950/60 p-4 text-xs text-slate-400">
            <p class="font-semibold text-white">Why we ask for an account</p>
            <p class="mt-2">
              We generate contracts, sync with the owner desktop, and send SMS reminders through Twilio so your night runs smooth.
            </p>
          </div>

          <div class="grid gap-2 text-xs text-slate-400">
            <p>Need help? Call or text the concierge at <a class="text-brand-teal" href="tel:+12125551234">(212) 555-1234</a>.</p>
            <button type="button" class="self-start text-brand-pink underline" on:click={reset}>Clear selections</button>
          </div>
        </aside>
      </div>

      <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-5 sm:px-10">
        <div class="flex gap-2 text-xs text-slate-500">
          <span>Secure checkout · Stripe</span>
          <span>•</span>
          <span>Instant management after booking</span>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            class="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
            on:click={goBack}
            disabled={step === 0}
          >
            Back
          </button>
          {#if step < steps.length - 1}
            <button
              type="button"
              class="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-teal/80"
              on:click={goNext}
            >
              Next step
            </button>
          {:else}
            <button
              type="button"
              class="rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-pink/90"
              on:click={fakeSubmit}
            >
              Request booking invite
            </button>
          {/if}
        </div>
      </footer>
    </div>
  </div>
{/if}
