import '@testing-library/jest-dom/vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { resetConnection } from '../lib/storage'

// A fresh, empty database for every test.
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  globalThis.IDBKeyRange = IDBKeyRange
  resetConnection()
})

// jsdom has neither a canvas implementation nor ResizeObserver.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
