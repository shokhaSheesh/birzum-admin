import { useEffect, useState } from 'react'

/** Seconds ticking down to zero. Call the setter to start or restart it. */
export function useCountdown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  return [secondsLeft, setSecondsLeft] as const
}
