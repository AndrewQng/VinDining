import { createInitialMockDb, MOCK_DB_VERSION, type MockDatabase } from './seed'

const STORAGE_KEY = 'vd-mock-db'

let memoryDb: MockDatabase | null = null

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

/** Loads the persisted mock database from localStorage, or seeds a fresh one. */
export function getMockDb(): MockDatabase {
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as MockDatabase
        if (parsed && parsed.version === MOCK_DB_VERSION) {
          memoryDb = parsed
          return memoryDb
        }
      }
    } catch {
      // Corrupt JSON falls back to fresh seed
    }
  } else if (memoryDb) {
    return memoryDb
  }

  memoryDb = createInitialMockDb()
  saveMockDb(memoryDb)
  return memoryDb
}

/** Saves the current mock database state to localStorage. */
export function saveMockDb(db: MockDatabase): void {
  memoryDb = db
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      // Ignore storage quota errors
    }
  }
}

/** Resets the mock database back to the canonical §10 seed data. */
export function resetMockDb(): MockDatabase {
  const fresh = createInitialMockDb()
  saveMockDb(fresh)
  return fresh
}

let idSeq = 0

/** Generates a deterministic-safe unique ID for mock entities. */
export function nextMockId(prefix: string): string {
  idSeq += 1
  return `${prefix}-${Date.now()}-${idSeq}`
}
