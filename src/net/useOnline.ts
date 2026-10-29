import { useCallback, useEffect, useRef, useState } from 'react'
import Peer, { type DataConnection } from 'peerjs'
import { type NetMessage, parseMessage, peerIdFor, randomCode } from './protocol'

export type NetStatus = 'idle' | 'hosting' | 'joining' | 'connected' | 'left' | 'error'
export type NetRole = 'host' | 'guest'

const JOIN_TIMEOUT_MS = 15000
const MAX_CODE_TRIES = 8

/**
 * Peer-to-peer link for two players. The host registers a 4-digit code as its
 * peer id on the PeerJS broker; the guest connects to that id. After the
 * handshake, moves travel directly between the two browsers.
 */
export function useOnline(onMessage: (m: NetMessage) => void) {
  const [status, setStatus] = useState<NetStatus>('idle')
  const [role, setRole] = useState<NetRole | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const peerRef = useRef<Peer | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlerRef = useRef(onMessage)
  handlerRef.current = onMessage

  const teardown = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    const conn = connRef.current
    connRef.current = null // cleared first so our own close() is not reported as "left"
    conn?.close()
    peerRef.current?.destroy()
    peerRef.current = null
  }, [])

  const fail = useCallback(
    (message: string) => {
      teardown()
      setError(message)
      setStatus('error')
    },
    [teardown],
  )

  const attach = useCallback((conn: DataConnection) => {
    conn.on('data', (raw: unknown) => {
      const msg = parseMessage(raw)
      if (msg) handlerRef.current(msg)
    })
    conn.on('close', () => {
      if (connRef.current === conn) setStatus('left')
    })
    conn.on('error', () => {
      if (connRef.current === conn) setStatus('left')
    })
  }, [])

  const host = useCallback(() => {
    teardown()
    setRole('host')
    setStatus('hosting')
    setCode('')
    setError('')

    const open = (attempt: number) => {
      const c = randomCode()
      const peer = new Peer(peerIdFor(c))
      peerRef.current = peer

      peer.on('open', () => setCode(c))

      peer.on('connection', (conn) => {
        // One friend per game: turn away anyone else who guesses the code.
        if (connRef.current) {
          conn.on('open', () => conn.close())
          return
        }
        connRef.current = conn
        attach(conn)
        conn.on('open', () => setStatus('connected'))
      })

      peer.on('error', (err) => {
        const type = String(err.type)
        if (type === 'unavailable-id' && attempt < MAX_CODE_TRIES) {
          // Someone else is already using this code. Pick another one.
          peer.destroy()
          open(attempt + 1)
          return
        }
        fail(
          type === 'network' || type === 'server-error' || type === 'socket-error'
            ? 'Could not reach the matchmaking server. Check your connection and try again.'
            : 'Could not start the game. Try again in a moment.',
        )
      })
    }
    open(0)
  }, [attach, fail, teardown])

  const join = useCallback(
    (c: string) => {
      teardown()
      setRole('guest')
      setStatus('joining')
      setCode(c)
      setError('')

      const peer = new Peer()
      peerRef.current = peer

      peer.on('open', () => {
        const conn = peer.connect(peerIdFor(c), { reliable: true })
        connRef.current = conn
        attach(conn)
        conn.on('open', () => {
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = null
          setStatus('connected')
        })
      })

      peer.on('error', (err) => {
        const type = String(err.type)
        fail(
          type === 'peer-unavailable'
            ? `No game found with code ${c}. Check the code with your friend.`
            : type === 'network' || type === 'server-error' || type === 'socket-error'
              ? 'Could not reach the matchmaking server. Check your connection and try again.'
              : 'Could not join the game. Try again in a moment.',
        )
      })

      timerRef.current = setTimeout(() => {
        if (!connRef.current?.open) fail(`Could not connect to game ${c}. Ask your friend to host again.`)
      }, JOIN_TIMEOUT_MS)
    },
    [attach, fail, teardown],
  )

  const send = useCallback((msg: NetMessage) => {
    const conn = connRef.current
    if (conn?.open) conn.send(msg)
  }, [])

  const leave = useCallback(() => {
    teardown()
    setStatus('idle')
    setRole(null)
    setCode('')
    setError('')
  }, [teardown])

  useEffect(() => teardown, [teardown])

  return { status, role, code, error, host, join, send, leave }
}
