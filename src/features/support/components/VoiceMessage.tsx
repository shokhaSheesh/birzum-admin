import { Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

const BARS = 28
export const voiceClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** Bar heights from 0.25 to 1, always the same for the same message. */
function waveform(seed: number) {
  let state = seed * 9301 + 49297
  return Array.from({ length: BARS }, () => {
    state = (state * 9301 + 49297) % 233280
    return 0.25 + (state / 233280) * 0.75
  })
}

type Props = {
  /** Length in seconds. */
  duration: number
  /** Gives each message its own waveform. */
  seed: number
  /** On the brand colour (not used in the admin, where only clients send voice). */
  mine?: boolean
}

/**
 * A client's voice message in the support chat: play/pause, a waveform that fills as it plays,
 * and the time. Admins listen only; they answer in text. The prototype has no sound.
 */
export function VoiceMessage({ duration, seed, mine = false }: Props) {
  const { t } = useI18n()
  const [playing, setPlaying] = useState(false)
  const [played, setPlayed] = useState(0)

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setPlayed((current) => {
        if (current + 0.1 >= duration) {
          setPlaying(false)
          return 0
        }
        return current + 0.1
      })
    }, 100)
    return () => clearInterval(timer)
  }, [playing, duration])

  const share = played / duration
  return (
    <div className="flex w-56 max-w-full items-center gap-2.5">
      <button
        type="button"
        aria-label={playing ? t('support.voice.pause') : t('support.voice.play')}
        onClick={() => setPlaying((value) => !value)}
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-full',
          mine ? 'bg-on-primary/20 text-on-primary' : 'bg-primary text-on-primary',
        )}
      >
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex h-7 items-center gap-[2px]" aria-hidden>
          {waveform(seed).map((height, i) => (
            <span
              key={i}
              className={cn(
                'w-[3px] flex-1 rounded-full',
                i / BARS < share || (playing && i === 0)
                  ? mine
                    ? 'bg-on-primary'
                    : 'bg-primary'
                  : mine
                    ? 'bg-on-primary/40'
                    : 'bg-navy-200',
              )}
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </div>
        <span className="text-[11px] tabular-nums opacity-70">
          {voiceClock(playing || played > 0 ? played : duration)}
        </span>
      </div>
    </div>
  )
}
