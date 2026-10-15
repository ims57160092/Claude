import type { ReactNode } from 'react'

interface Props {
  /** The script title across the top, as on a printed planner page. */
  title: string
  /** What the page covers (a date, a week, a month); the page's real heading. */
  heading: string
  children: ReactNode
}

/** A sheet of planner paper. */
export function Page({ title, heading, children }: Props) {
  return (
    <section className="bg-paper rounded-[3px] px-4 pt-5 pb-6 shadow-[0_1px_2px_rgb(109_51_44/0.08),0_18px_40px_-24px_rgb(109_51_44/0.45)] sm:px-8 sm:pt-7 sm:pb-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <p
          aria-hidden
          className="font-script text-3xl leading-none text-stone-900 sm:text-4xl"
        >
          {title}
        </p>
        <h1 className="flex min-w-0 items-baseline gap-3 border-b border-stone-300 pb-1 text-stone-700">
          <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-stone-400">
            DATE
          </span>
          <span className="text-sm font-medium text-balance">{heading}</span>
        </h1>
      </header>
      {children}
    </section>
  )
}
