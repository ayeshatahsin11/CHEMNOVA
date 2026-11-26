import { useCallback, useEffect, useRef, useState } from 'react'
import { getRecognition } from '../lib/speech'

const blockedMessage =
  'Microphone access is blocked. Allow it from the lock icon in the address bar, then try again.'

const messages = {
  'not-allowed': blockedMessage,
  'service-not-allowed': blockedMessage,
  'audio-capture': 'No microphone was found. Check that one is connected and not used by another app.',
  network: 'Speech recognition needs an internet connection. Check your connection and try again.',
  'language-not-supported': 'This accent is not supported by your browser. Choose another one.',
}

// Turns speech into text. onFinal(text) is called with each finished phrase.
export default function useSpeechInput({ lang = 'en-US', onFinal }) {
  const Recognition = getRecognition()
  const supported = Boolean(Recognition)

  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')

  const recRef = useRef(null)
  const wantRef = useRef(false) // true while the person wants to keep listening
  const restartsRef = useRef(0)
  const onFinalRef = useRef(onFinal)
  const beginRef = useRef(() => {})

  useEffect(() => {
    onFinalRef.current = onFinal
  })

  useEffect(() => {
    beginRef.current = () => {
      if (!Recognition) return

      const rec = new Recognition()
      rec.lang = lang
      rec.continuous = true
      rec.interimResults = true
      rec.maxAlternatives = 1
      const startedAt = Date.now()

      rec.onstart = () => setListening(true)

      rec.onresult = (event) => {
        let live = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const piece = result[0]?.transcript ?? ''
          if (result.isFinal) {
            if (piece.trim()) onFinalRef.current?.(piece.trim())
          } else {
            live += piece
          }
        }
        setInterim(live)
      }

      rec.onerror = (event) => {
        // "no-speech" is just a long silence, and onend below starts listening again
        if (event.error === 'aborted' || event.error === 'no-speech') return
        wantRef.current = false
        setError(messages[event.error] ?? 'Speech recognition stopped unexpectedly. Try again, or type your answer.')
      }

      rec.onend = () => {
        setInterim('')

        if (wantRef.current) {
          // Browsers end a session after a pause, so listen again unless it keeps failing right away
          restartsRef.current = Date.now() - startedAt < 800 ? restartsRef.current + 1 : 0
          if (restartsRef.current < 3) {
            setTimeout(() => {
              if (wantRef.current) beginRef.current()
            }, 250)
            return
          }
          wantRef.current = false
          setError('Speech recognition keeps stopping. Try again, or type your answer.')
        }

        setListening(false)
      }

      recRef.current = rec
      try {
        rec.start()
      } catch {
        wantRef.current = false
        setListening(false)
      }
    }
  }, [Recognition, lang])

  const start = useCallback(() => {
    if (!Recognition || wantRef.current) return
    setError('')
    wantRef.current = true
    restartsRef.current = 0
    beginRef.current()
  }, [Recognition])

  const stop = useCallback(() => {
    wantRef.current = false
    setListening(false)
    setInterim('')
    try {
      recRef.current?.stop() // the last phrase is still delivered before it ends
    } catch {
      // it was not running
    }
  }, [])

  // Release the microphone when the component goes away
  useEffect(() => {
    return () => {
      wantRef.current = false
      try {
        recRef.current?.abort()
      } catch {
        // nothing to abort
      }
    }
  }, [])

  return { supported, listening, interim, error, start, stop }
}