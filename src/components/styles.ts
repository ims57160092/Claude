// Shared class lists for the printable-planner look.

/** Round tick box, like the circles on a paper to-do list. */
export const CHECKBOX =
  'grid size-5 shrink-0 cursor-pointer appearance-none place-content-center rounded-full border-2 border-coral-300 bg-white transition checked:border-coral-500 checked:bg-coral-500 before:size-2 before:rounded-full before:bg-white before:opacity-0 before:content-[""] checked:before:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500'

/** Small pink strip that labels a block (TO DO, NOTES, MONDAY). */
export const LABEL_STRIP =
  'flex items-baseline gap-2 rounded-sm bg-coral-100 px-3 py-1 text-coral-800'

/** The latin word in a label strip, set in small spaced capitals. */
export const LABEL_WORD =
  'text-[0.7rem] font-semibold tracking-[0.2em] uppercase'

/** Text field on paper: a thin rule rather than a box. */
export const FIELD =
  'rounded-sm border border-stone-200 bg-white px-3 py-2 text-base focus:border-coral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-200'

export const PRIMARY_BUTTON =
  'rounded-full bg-coral-600 px-5 py-2 font-medium text-white transition hover:bg-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500 disabled:opacity-40'

export const QUIET_BUTTON =
  'rounded-full px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-coral-50 focus-visible:outline-2 focus-visible:outline-coral-500 disabled:opacity-40'
