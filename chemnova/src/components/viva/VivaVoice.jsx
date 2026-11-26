import { useEffect, useRef } from 'react'
import { Mic, Square, Volume2, VolumeX, Info } from 'lucide-react'
import useVoicePrefs from '../../hooks/useVoicePrefs'
import useSpeechOutput from '../../hooks/useSpeechOutput'
import useSpeechInput from '../../hooks/useSpeechInput'
import { accents, fixTranscript } from '../../lib/speech'

const smallBtn =
  'inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium transition hover:border-accent/50 disabled:pointer-events-none disabled:opacity-60'
const warnBtn = smallBtn.replace('border-border', 'border-amber-400/60 text-amber-500')

export default function VivaVoice({ questionId, questionText, answer, onChange, maxChars, disabled }) {
  const [prefs, updatePrefs] = useVoicePrefs()
  const { supported: canTalk, speaking, blocked, speak, stop: stopSpeaking } = useSpeechOutput(prefs.lang)

  const answerRef = useRef(answer)
  const latest = useRef({})

  useEffect(() => {
    answerRef.current = answer
  })

  const input = useSpeechInput({
    lang: prefs.lang,
    onFinal: (piece) => {
      const current = answerRef.current ?? ''
      const gap = current && !/\s$/.test(current) ? ' ' : ''
      const next = `${current}${gap}${fixTranscript(piece)}`.slice(0, maxChars)

      answerRef.current = next // updated now, so two phrases in a row both land
      onChange(next)
    },
  })
  const { stop: stopListening } = input

  useEffect(() => {
    latest.current = { speak, text: questionText, auto: prefs.autoRead && canTalk }
  })

  // Read each new question aloud, and go quiet when the question changes or the page closes
  useEffect(() => {
    if (latest.current.auto) latest.current.speak(latest.current.text)
    return () => stopSpeaking()
  }, [questionId, stopSpeaking])

  // While an answer is being submitted, stop the microphone and the voice
  useEffect(() => {
    if (disabled) {
      stopListening()
      stopSpeaking()
    }
  }, [disabled, stopListening, stopSpeaking])

  if (!canTalk && !input.supported) {
    return (
      <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-500">
        <Info size={16} className="mt-0.5 shrink-0" />
        Voice is not available in this browser. Use Chrome or Edge, or type your answer below.
      </div>
    )
  }

  const toggleMic = () => {
    if (input.listening) {
      stopListening()
      return
    }
    stopSpeaking() // otherwise the microphone would hear the examiner
    input.start()
  }

  const replay = () => {
    stopListening()
    speak(questionText)
  }

  const toggleAuto = () => {
    if (prefs.autoRead) stopSpeaking()
    updatePrefs({ autoRead: !prefs.autoRead })
  }

  const changeAccent = (e) => {
    stopListening()
    updatePrefs({ lang: e.target.value })
  }

  return (
    <div className="mt-5 space-y-4 rounded-xl border border-border bg-surface-2/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {canTalk && (
          <>
            <button type="button" onClick={replay} disabled={disabled} className={blocked ? warnBtn : smallBtn}>
              <Volume2 size={14} className={speaking ? 'animate-pulse text-accent' : ''} />
              {speaking ? 'Speaking...' : blocked ? 'Tap to hear the question' : 'Replay question'}
            </button>
            <button type="button" onClick={toggleAuto} aria-pressed={prefs.autoRead} className={smallBtn}>
              {prefs.autoRead ? <Volume2 size={14} /> : <VolumeX size={14} />}
              Auto-read: {prefs.autoRead ? 'on' : 'off'}
            </button>
          </>
        )}

        <label className="ml-auto flex items-center gap-2 text-xs text-muted">
          Accent
          <select
            value={prefs.lang}
            onChange={changeAccent}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-content outline-none focus:border-accent"
          >
            {accents.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {input.supported ? (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled}
            aria-pressed={input.listening}
            className={`flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-60 ${
              input.listening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-r from-cyan-400 to-violet-400 text-[#04121c] hover:-translate-y-0.5'
            }`}
          >
            {input.listening ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                </span>
                <Square size={14} /> Stop listening
              </>
            ) : (
              <>
                <Mic size={17} /> Speak your answer
              </>
            )}
          </button>

          <p aria-live="polite" className="min-w-0 flex-1 text-sm text-muted">
            {input.listening ? (
              input.interim ? (
                <span className="italic">{input.interim}...</span>
              ) : (
                'Listening. Your words will appear in the box below.'
              )
            ) : (
              'Your words are added to the answer box, where you can edit them.'
            )}
          </p>
        </div>
      ) : (
        <p className="flex items-start gap-2 text-sm text-muted">
          <Info size={16} className="mt-0.5 shrink-0" />
          Speaking answers is not supported in this browser. Try Chrome or Edge, or type below.
        </p>
      )}

      {input.error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {input.error}
        </p>
      )}

      {blocked && (
        <p className="text-xs text-amber-500">
          Your browser blocks automatic speech until you interact with the page. Use the button above to hear the
          question.
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted">
        Check the text before you submit, because speech recognition can mishear chemistry terms and formulas. Your
        browser&apos;s online speech service turns your voice into text. Only the text you submit is sent to ChemNova.
      </p>
    </div>
  )
}