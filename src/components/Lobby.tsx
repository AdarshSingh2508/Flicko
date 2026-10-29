import { useState, type FormEvent, type ReactNode } from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
import type { NetStatus } from '../net/useOnline'
import { CODE_LENGTH, isValidCode } from '../net/protocol'

interface Props {
  status: NetStatus
  code: string
  error: string
  onHost: () => void
  onJoin: (code: string) => void
  onLeave: () => void
}

const SHADOW = 'shadow-[3px_3px_0_0_#1A2250]'
const PRESS = 'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'
const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-paper'
const BTN = `inline-flex items-center justify-center gap-2 rounded-md border-2 border-ink px-4 py-2.5 text-sm font-semibold ${SHADOW} ${PRESS} transition-[transform,box-shadow] ${FOCUS} disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0`
const BTN_SOLID = `${BTN} bg-ink text-paper hover:bg-ink/90`
const BTN_SOFT = `${BTN} bg-paper hover:bg-white/60`

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[34rem] flex-col gap-5 rounded-md border-2 border-ink bg-white/40 p-6 shadow-[5px_5px_0_0_#1A2250] sm:p-8">
      <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h2>
      {children}
    </div>
  )
}

export function Lobby({ status, code, error, onHost, onJoin, onLeave }: Props) {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const copy = async (what: 'code' | 'link', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      /* clipboard can be blocked; the code is on screen anyway */
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (isValidCode(input)) onJoin(input)
  }

  if (status === 'hosting') {
    const link = `${window.location.origin}${window.location.pathname}?join=${code}`
    return (
      <Card title="Waiting for your friend">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-ink-soft">Your game code</p>
          <div className="flex gap-2.5" aria-label={code ? `Game code ${code.split('').join(' ')}` : 'Getting a code'}>
            {code
              ? code.split('').map((d, i) => (
                  <span
                    key={i}
                    className="flex h-20 w-14 items-center justify-center rounded-md border-2 border-ink bg-paper text-5xl font-extrabold tabular-nums shadow-[3px_3px_0_0_#1A2250] sm:h-24 sm:w-16"
                  >
                    {d}
                  </span>
                ))
              : Array.from({ length: CODE_LENGTH }, (_, i) => (
                  <span key={i} className="h-20 w-14 rounded-md border-2 border-dashed border-ink/40 sm:h-24 sm:w-16" />
                ))}
          </div>
        </div>
        <p className="max-w-[40ch] text-base">
          {code
            ? 'Send this code to your friend. The game starts the moment they join.'
            : 'Getting a code…'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button className={BTN_SOFT} disabled={!code} onClick={() => copy('code', code)}>
            {copied === 'code' ? <Check size={16} /> : <Copy size={16} />}
            {copied === 'code' ? 'Copied' : 'Copy code'}
          </button>
          <button className={BTN_SOFT} disabled={!code} onClick={() => copy('link', link)}>
            {copied === 'link' ? <Check size={16} /> : <Link2 size={16} />}
            {copied === 'link' ? 'Copied' : 'Copy invite link'}
          </button>
          <button className={BTN_SOFT} onClick={onLeave}>
            Cancel
          </button>
        </div>
      </Card>
    )
  }

  if (status === 'joining') {
    return (
      <Card title={`Joining game ${code}`}>
        <p aria-live="polite" className="max-w-[40ch] text-base">
          Connecting to your friend…
        </p>
        <div>
          <button className={BTN_SOFT} onClick={onLeave}>
            Cancel
          </button>
        </div>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card title="Could not connect">
        <p role="alert" className="max-w-[40ch] text-base">
          {error}
        </p>
        <div>
          <button className={BTN_SOLID} onClick={onLeave}>
            Back
          </button>
        </div>
      </Card>
    )
  }

  if (status === 'left') {
    return (
      <Card title="Your friend left">
        <p className="max-w-[40ch] text-base">The connection closed. Host a new game or join another one.</p>
        <div>
          <button className={BTN_SOLID} onClick={onLeave}>
            Back to start
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Play a friend online">
      <p className="max-w-[44ch] text-base">
        One of you hosts and shares a 4-digit code. The other types it in to join. You each play on your own device.
      </p>
      <div>
        <button className={BTN_SOLID} onClick={onHost}>
          Host a game
        </button>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-2 border-t-2 border-ink/15 pt-5">
        <label htmlFor="join-code" className="text-sm font-semibold">
          Have a code from a friend?
        </label>
        <div className="flex gap-3">
          <input
            id="join-code"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={CODE_LENGTH}
            autoComplete="off"
            placeholder="0000"
            className={`w-32 rounded-md border-2 border-ink bg-paper px-3 py-2.5 text-center text-2xl font-extrabold tabular-nums tracking-[0.3em] placeholder:text-ink/25 ${FOCUS}`}
          />
          <button type="submit" className={BTN_SOFT} disabled={!isValidCode(input)}>
            Join game
          </button>
        </div>
      </form>
    </Card>
  )
}
