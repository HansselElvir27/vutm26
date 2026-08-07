'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logoutInactive } from '@/app/actions/auth'

/** Minutos de inactividad antes de cerrar sesión */
const INACTIVITY_MINUTES = 10
const WARNING_SECONDS = 60  // Aviso 60 s antes del cierre

const INACTIVITY_MS  = INACTIVITY_MINUTES * 60 * 1000
const WARNING_MS     = INACTIVITY_MS - WARNING_SECONDS * 1000

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const

export function InactivityWatcher() {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft]  = useState(WARNING_SECONDS)

  const warningTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearAllTimers = () => {
    if (warningTimerRef.current)  clearTimeout(warningTimerRef.current)
    if (logoutTimerRef.current)   clearTimeout(logoutTimerRef.current)
    if (countdownRef.current)     clearInterval(countdownRef.current)
  }

  const startTimers = useCallback(() => {
    clearAllTimers()
    setShowWarning(false)
    setSecondsLeft(WARNING_SECONDS)

    // Timer para mostrar advertencia
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsLeft(WARNING_SECONDS)

      // Countdown visual
      countdownRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, WARNING_MS)

    // Timer de cierre de sesión
    logoutTimerRef.current = setTimeout(async () => {
      clearAllTimers()
      setShowWarning(false)
      await logoutInactive()
      router.push('/login?reason=inactivity')
    }, INACTIVITY_MS)
  }, [router])

  const handleActivity = useCallback(() => {
    if (!showWarning) {
      startTimers()
    }
  }, [showWarning, startTimers])

  const handleContinue = () => {
    setShowWarning(false)
    startTimers()
  }

  const handleLogoutNow = async () => {
    clearAllTimers()
    setShowWarning(false)
    await logoutInactive()
    router.push('/login')
  }

  useEffect(() => {
    startTimers()

    ACTIVITY_EVENTS.forEach(event =>
      window.addEventListener(event, handleActivity, { passive: true })
    )

    return () => {
      clearAllTimers()
      ACTIVITY_EVENTS.forEach(event =>
        window.removeEventListener(event, handleActivity)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reiniciar timers cuando el usuario retoma actividad (solo si NO hay advertencia activa)
  useEffect(() => {
    if (!showWarning) {
      ACTIVITY_EVENTS.forEach(event =>
        window.addEventListener(event, handleActivity, { passive: true })
      )
    } else {
      ACTIVITY_EVENTS.forEach(event =>
        window.removeEventListener(event, handleActivity)
      )
    }
    return () => {
      ACTIVITY_EVENTS.forEach(event =>
        window.removeEventListener(event, handleActivity)
      )
    }
  }, [showWarning, handleActivity])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 px-6 py-4 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Sesión por expirar</h2>
            <p className="text-amber-100 text-xs">Inactividad detectada</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Su sesión se cerrará automáticamente por inactividad en:
          </p>

          {/* Countdown */}
          <div className="flex items-center justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                  cx="48" cy="48" r="42"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - secondsLeft / WARNING_SECONDS)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                  {secondsLeft}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">seg</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Si desea continuar trabajando, haga clic en <strong>Continuar sesión</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleLogoutNow}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cerrar sesión
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Continuar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
