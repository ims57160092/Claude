import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white px-4 text-gray-600 dark:bg-gray-950 dark:text-gray-400">
      <div className="flex items-center gap-6">
        <img src={viteLogo} className="h-16 w-16" alt="Vite logo" />
        <img
          src={reactLogo}
          className="h-16 w-16 motion-safe:animate-[spin_20s_linear_infinite]"
          alt="React logo"
        />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100">
          Get started
        </h1>
        <p className="mt-2">
          Edit{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm dark:bg-gray-800">
            src/App.tsx
          </code>{' '}
          and save to test HMR
        </p>
      </div>
      <button
        type="button"
        className="rounded-lg border border-purple-500/50 bg-purple-500/10 px-4 py-2 font-medium text-purple-700 transition hover:bg-purple-500/20 focus-visible:outline-2 focus-visible:outline-purple-500 dark:text-purple-300"
        onClick={() => setCount((count) => count + 1)}
      >
        Count is {count}
      </button>
    </main>
  )
}

export default App
