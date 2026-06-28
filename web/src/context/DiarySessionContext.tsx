import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { hashDiaryPassword, verifyDiaryPassword } from '@/lib/password'

const HASH_KEY = 'diary_password_hash'
const UNLOCK_MS = 30 * 60 * 1000

type State = {
  passwordHash: string | null
  unlockedUntil: number | null
}

type Action =
  | { type: 'hydrate'; hash: string | null; unlockedUntil: number | null }
  | { type: 'setPassword'; plain: string }
  | { type: 'unlock'; until: number }
  | { type: 'lock' }

function loadHash(): string | null {
  try {
    return localStorage.getItem(HASH_KEY)
  } catch {
    return null
  }
}

function saveHash(hash: string | null) {
  try {
    if (hash) localStorage.setItem(HASH_KEY, hash)
    else localStorage.removeItem(HASH_KEY)
  } catch {
    /* ignore */
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { passwordHash: action.hash, unlockedUntil: action.unlockedUntil }
    case 'setPassword': {
      const passwordHash = hashDiaryPassword(action.plain)
      saveHash(passwordHash)
      return { ...state, passwordHash, unlockedUntil: Date.now() + UNLOCK_MS }
    }
    case 'unlock':
      return { ...state, unlockedUntil: action.until }
    case 'lock':
      return { ...state, unlockedUntil: null }
    default:
      return state
  }
}

type WriteSession = { password: string; until: number }

type Ctx = {
  hasPassword: boolean
  isUnlocked: boolean
  /** Plaintext password for Edge Function calls while session is active (memory only). */
  getWritePassword: () => string | null
  setPassword: (plain: string) => void
  tryUnlock: (plain: string) => boolean
  lock: () => void
  changePassword: (currentPlain: string, nextPlain: string) => boolean
}

const DiarySessionContext = createContext<Ctx | null>(null)

function useTickingNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function initialState(): State {
  return {
    passwordHash: loadHash(),
    unlockedUntil: null,
  }
}

export function DiarySessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const writeSessionRef = useRef<WriteSession | null>(null)
  const now = useTickingNow()

  const isUnlocked = Boolean(state.unlockedUntil && state.unlockedUntil > now)

  const getWritePassword = useCallback((): string | null => {
    const s = writeSessionRef.current
    if (!s || s.until <= Date.now()) {
      writeSessionRef.current = null
      return null
    }
    return s.password
  }, [])

  const setPassword = useCallback((plain: string) => {
    const until = Date.now() + UNLOCK_MS
    writeSessionRef.current = { password: plain, until }
    dispatch({ type: 'setPassword', plain })
  }, [])

  const tryUnlock = useCallback(
    (plain: string) => {
      if (!state.passwordHash) return false
      if (!verifyDiaryPassword(plain, state.passwordHash)) return false
      const until = Date.now() + UNLOCK_MS
      writeSessionRef.current = { password: plain, until }
      dispatch({ type: 'unlock', until })
      return true
    },
    [state.passwordHash],
  )

  const lock = useCallback(() => {
    writeSessionRef.current = null
    dispatch({ type: 'lock' })
  }, [])

  const changePassword = useCallback(
    (currentPlain: string, nextPlain: string) => {
      if (!state.passwordHash) return false
      if (!verifyDiaryPassword(currentPlain, state.passwordHash)) return false
      const passwordHash = hashDiaryPassword(nextPlain)
      saveHash(passwordHash)
      const until = Date.now() + UNLOCK_MS
      writeSessionRef.current = { password: nextPlain, until }
      dispatch({
        type: 'hydrate',
        hash: passwordHash,
        unlockedUntil: until,
      })
      return true
    },
    [state.passwordHash],
  )

  const value = useMemo(
    () => ({
      hasPassword: Boolean(state.passwordHash),
      isUnlocked,
      getWritePassword,
      setPassword,
      tryUnlock,
      lock,
      changePassword,
    }),
    [
      state.passwordHash,
      isUnlocked,
      getWritePassword,
      setPassword,
      tryUnlock,
      lock,
      changePassword,
    ],
  )

  return (
    <DiarySessionContext.Provider value={value}>
      {children}
    </DiarySessionContext.Provider>
  )
}

// Colocated hook for this provider; splitting would scatter tiny files.
// eslint-disable-next-line react-refresh/only-export-components
export function useDiarySession(): Ctx {
  const ctx = useContext(DiarySessionContext)
  if (!ctx) throw new Error('useDiarySession must be used within DiarySessionProvider')
  return ctx
}
