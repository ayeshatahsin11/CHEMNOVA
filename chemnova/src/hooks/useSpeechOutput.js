import { useCallback, useEffect, useRef, useState } from 'react'
import { canSpeak, toSpeakable, chunkText } from '../lib/speech'

function pickVoice(voices, lang) {
  const base = lang.slice(0, 2)
  const same = (v) => v.lang.replace('_', '-') === lang
  const sameLanguage = (v) => v.lang.replace('_', '-').startsWith(base)

  return (
    voices.find((v) => same(v) && /natural|online|google|premium/i.test(v.name)) ||
    voices.find(same) ||
    voices.find(sameLanguage) ||
    null
  )
}

// Reads text aloud with the browser's built-in voices
export default function useSpeechOutput(lang = 'en-US') {
  const supported = canSpeak()
  const [speaking, setSpeaking] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const voicesRef = useRef([])
  const timerRef = useRef(null)
  const runRef = useRef(0) // identifies the current reading, so callbacks from an old one do nothing

  // Voices load a moment after the page does
  useEffect(() => {
    if (!supported) return
    const synth = window.speechSynthesis
    const load = () => {
      voicesRef.current = synth.getVoices()
    }
    load()
    synth.addEventListener?.('voiceschanged', load)
    return () => synth.removeEventListener?.('voiceschanged', load)
  }, [supported])

  const stop = useCallback(() => {
    clearTimeout(timerRef.current)
    runRef.current += 1
    if (canSpeak()) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  // Stop talking when the component goes away
  useEffect(() => stop, [stop])

  const speak = useCallback(
    (text) => {
      if (!canSpeak()) return
      const synth = window.speechSynthesis

      clearTimeout(timerRef.current)
      runRef.current += 1
      const run = runRef.current
      synth.cancel()
      setBlocked(false)

      const chunks = chunkText(toSpeakable(text))
      if (!chunks.length) {
        setSpeaking(false)
        return
      }
      setSpeaking(true)

      // Chrome can drop a speak() that comes right after cancel(), so wait a moment
      timerRef.current = setTimeout(() => {
        const voice = pickVoice(voicesRef.current, lang)

        chunks.forEach((chunk, i) => {
          const utterance = new SpeechSynthesisUtterance(chunk)
          utterance.lang = lang
          if (voice) utterance.voice = voice

          if (i === chunks.length - 1) {
            utterance.onend = () => {
              if (runRef.current === run) setSpeaking(false)
            }
          }
          utterance.onerror = (event) => {
            if (runRef.current !== run) return
            if (event.error === 'not-allowed') setBlocked(true)
            if (event.error !== 'interrupted' && event.error !== 'canceled') setSpeaking(false)
          }

          synth.speak(utterance)
        })
      }, 80)
    },
    [lang],
  )

  return { supported, speaking, blocked, speak, stop }
}