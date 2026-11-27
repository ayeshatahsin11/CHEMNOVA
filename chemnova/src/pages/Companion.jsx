import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { History, Plus, AlertCircle, RefreshCw, SearchX, Lock, Info } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import useVoicePrefs from '../hooks/useVoicePrefs'
import useSpeechInput from '../hooks/useSpeechInput'
import useSpeechOutput from '../hooks/useSpeechOutput'
import { accents, fixTranscript } from '../lib/speech'
import { plainText } from '../lib/companion'
import { panelClass } from '../lib/viva'
import {
  getCompanionOptions,
  listConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  sendMessage,
} from '../api/companion'
import SpotlightCard from '../components/ui/SpotlightCard'
import FormAlert from '../components/auth/FormAlert'
import ThinkingIndicator from '../components/viva/ThinkingIndicator'
import ConversationList from '../components/companion/ConversationList'
import ModePicker from '../components/companion/ModePicker'
import EmptyChat from '../components/companion/EmptyChat'
import MessageBubble from '../components/companion/MessageBubble'
import ChatInput from '../components/companion/ChatInput'

const block = 'animate-pulse rounded-2xl bg-surface-2/60'

function ChatView({ options, initialConversations }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const guest = user.isGuest
  const { maxMessageChars, maxMessages } = options.limits

  const modeLabels = useMemo(() => Object.fromEntries(options.modes.map((m) => [m.id, m.label])), [options.modes])

  const [conversations, setConversations] = useState(initialConversations)
  const [conv, setConv] = useState(null) // the open conversation, or null for a new chat
  const [messages, setMessages] = useState([])
  const [load, setLoad] = useState({ status: 'ready', message: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const [mode, setMode] = useState('standard')
  const [level, setLevel] = useState(() => (options.levels.includes(user.level) ? user.level : options.levels[0]))
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(null) // { content } while waiting for the answer
  const [error, setError] = useState('')
  const [guestLeft, setGuestLeft] = useState(null)
  const [showList, setShowList] = useState(false)
  const [speakingId, setSpeakingId] = useState(null)
  const [voice, updateVoice] = useVoicePrefs()

  const pendingConv = useRef(null) // a conversation created for a first message that then failed
  const skipLoad = useRef(null) // stops a reload of the conversation we just created ourselves
  const inputRef = useRef('')
  const bottomRef = useRef(null)

  // ---- voice ----
  const speechIn = useSpeechInput({
    lang: voice.lang,
    onFinal: (piece) => {
      const current = inputRef.current ?? ''
      const gap = current && !/\s$/.test(current) ? ' ' : ''
      const next = `${current}${gap}${fixTranscript(piece)}`.slice(0, maxMessageChars)
      inputRef.current = next // updated now, so two phrases in a row both land
      setInput(next)
    },
  })
  const speechOut = useSpeechOutput(voice.lang)
  const { stop: stopListening } = speechIn
  const { stop: stopSpeaking } = speechOut

  useEffect(() => {
    inputRef.current = input
  })

  useEffect(() => {
    if (!speechOut.speaking) setSpeakingId(null)
  }, [speechOut.speaking])

  // ---- load the conversation named in the URL ----
  useEffect(() => {
    stopListening()
    stopSpeaking()

    if (!id) {
      setConv(null)
      setMessages([])
      setMode('standard')
      setError('')
      setLoad({ status: 'ready', message: '' })
      return
    }

    if (skipLoad.current === id) {
      skipLoad.current = null
      return
    }

    let cancelled = false
    setLoad({ status: 'loading', message: '' })

    getConversation(id).then(
      (res) => {
        if (cancelled) return
        setConv(res.conversation)
        setMessages(res.messages)
        setMode(res.conversation.mode)
        setLevel(res.conversation.level)
        setGuestLeft(res.guest?.remaining ?? null)
        setError('')
        setLoad({ status: 'ready', message: '' })
      },
      (err) => {
        if (cancelled) return
        const missing = err.status === 404 || err.status === 400
        setLoad({ status: missing ? 'missing' : 'error', message: err.message })
      },
    )

    return () => {
      cancelled = true
    }
  }, [id, reloadKey, stopListening, stopSpeaking])

  // Keep the newest message in view
  useEffect(() => {
    if (messages.length || pending) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, pending])

  // ---- actions ----
  const sending = Boolean(pending)
  const full = Boolean(conv && conv.messageCount >= maxMessages)
  const guestOut = guest && guestLeft === 0
  const locked = sending || full || guestOut || load.status !== 'ready'

  const upsert = (conversation) => {
    if (guest) return // guest chats are not saved, so they never appear in the list
    setConversations((list) => [conversation, ...list.filter((c) => c.id !== conversation.id)])
  }

  const send = async (text, forcedMode) => {
    const content = String(text ?? '').trim()
    if (!content || sending || locked) return

    const chosenMode = forcedMode ?? mode
    if (forcedMode) setMode(forcedMode)

    stopListening()
    stopSpeaking()
    setSpeakingId(null)
    setError('')
    setPending({ content })
    setInput('')
    inputRef.current = ''

    try {
      let cid = conv?.id ?? pendingConv.current

      if (!cid) {
        const created = await createConversation({ mode: chosenMode, level })
        cid = created.conversation.id
        pendingConv.current = cid
        setGuestLeft(created.guest?.remaining ?? null)
      }

      const res = await sendMessage(cid, { content, mode: chosenMode })
      setGuestLeft(res.guest?.remaining ?? null)

      if (conv) {
        setMessages((list) => [...list, res.userMessage, res.assistantMessage])
        setConv(res.conversation)
      } else {
        pendingConv.current = null
        skipLoad.current = cid
        setConv(res.conversation)
        setMessages([res.userMessage, res.assistantMessage])
        navigate(`/companion/${cid}`, { replace: true })
      }
      upsert(res.conversation)
    } catch (err) {
      setError(err.message)
      // Give the text back so nothing has to be retyped
      setInput((current) => current || content)
    } finally {
      setPending(null)
    }
  }

  const newChat = () => {
    setShowList(false)
    setError('')
    if (id) navigate('/companion')
  }

  const openConversation = (cid) => {
    setShowList(false)
    if (cid !== id) navigate(`/companion/${cid}`)
  }

  const changeLevel = async (value) => {
    const before = level
    setLevel(value)
    if (!conv) return
    try {
      const updated = await updateConversation(conv.id, { level: value })
      setConv(updated)
      upsert(updated)
    } catch (err) {
      setLevel(before)
      setError(err.message)
    }
  }

  const rename = async (cid, title) => {
    const updated = await updateConversation(cid, { title })
    setConversations((list) => list.map((c) => (c.id === cid ? updated : c)))
    if (conv?.id === cid) setConv(updated)
  }

  const remove = async (cid) => {
    await deleteConversation(cid)
    setConversations((list) => list.filter((c) => c.id !== cid))
    if (id === cid) navigate('/companion')
  }

  const toggleSpeak = (message) => {
    if (speakingId === message.id) {
      stopSpeaking()
      setSpeakingId(null)
      return
    }
    const text = plainText(message.content)
    if (!text) return
    stopListening()
    setSpeakingId(message.id)
    speechOut.speak(text)
  }

  const toggleMic = () => {
    if (speechIn.listening) {
      stopListening()
      return
    }
    stopSpeaking() // otherwise the microphone would hear the answer being read
    setSpeakingId(null)
    speechIn.start()
  }

  const changeAccent = (lang) => {
    stopListening()
    updateVoice({ lang })
  }

  // ---- what to show in the message area ----
  let body
  if (load.status === 'loading') {
    body = (
      <div className="space-y-6" aria-busy="true" aria-label="Loading conversation">
        <div className={`${block} ml-auto h-14 w-2/3`} />
        <div className={`${block} h-40 w-5/6`} />
        <div className={`${block} ml-auto h-14 w-1/2`} />
      </div>
    )
  } else if (load.status === 'missing') {
    body = (
      <div className="mx-auto max-w-sm py-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-accent">
          <SearchX size={26} />
        </span>
        <h3 className="mt-4 text-lg font-semibold">Conversation not found</h3>
        <p className="mt-1 text-sm text-muted">It may have been deleted, or it belongs to another account.</p>
        <button type="button" onClick={newChat} className="btn-glow mt-6">
          <Plus size={17} /> Start a new chat
        </button>
      </div>
    )
  } else if (load.status === 'error') {
    body = (
      <div className="mx-auto max-w-sm py-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-500">
          <AlertCircle size={26} />
        </span>
        <h3 className="mt-4 text-lg font-semibold">We could not load this chat</h3>
        <p className="mt-1 text-sm text-muted">{load.message}</p>
        <button type="button" onClick={() => setReloadKey((n) => n + 1)} className="btn-glow mt-6">
          <RefreshCw size={17} /> Try again
        </button>
      </div>
    )
  } else if (messages.length === 0 && !pending) {
    body = (
      <EmptyChat
        starters={options.starters}
        modeLabels={modeLabels}
        disabled={locked}
        onPick={(s) => send(s.text, s.mode)}
      />
    )
  } else {
    body = (
      <div className="space-y-6">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            modeLabel={m.role === 'assistant' ? modeLabels[m.mode] : null}
            canListen={speechOut.supported}
            listening={speakingId === m.id}
            onListen={() => toggleSpeak(m)}
          />
        ))}
        {pending && <MessageBubble pending message={{ role: 'user', content: pending.content }} />}
        {pending && <ThinkingIndicator text="The Companion is thinking..." />}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <button type="button" onClick={() => setShowList((s) => !s)} aria-expanded={showList} className="btn-outline text-sm">
          <History size={16} /> History
        </button>
        <button type="button" onClick={newChat} disabled={sending} className="btn-outline text-sm disabled:opacity-60">
          <Plus size={16} /> New chat
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className={showList ? 'block' : 'hidden lg:block'}>
          <ConversationList
            conversations={conversations}
            activeId={id}
            onSelect={openConversation}
            onNew={newChat}
            onRename={rename}
            onDelete={remove}
            disabled={sending}
            isGuest={guest}
          />
        </aside>

        <section className="flex min-h-[72vh] flex-col rounded-2xl border border-border bg-surface/60 backdrop-blur-md">
          <div className="space-y-3 border-b border-border p-4 sm:px-6">
            <ModePicker modes={options.modes} value={mode} onChange={setMode} disabled={sending} />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-muted">
                Level
                <select
                  value={level}
                  onChange={(e) => changeLevel(e.target.value)}
                  disabled={sending}
                  className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-content outline-none focus:border-accent disabled:opacity-60"
                >
                  {options.levels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>

              {guest && (
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs text-muted">
                  <Info size={12} />
                  Guest: {guestLeft ?? options.guest?.messagesPerDay} messages left
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6">
            {body}
            <div ref={bottomRef} />
          </div>

          <div className="sticky bottom-0 rounded-b-2xl border-t border-border bg-bg/90 p-4 backdrop-blur-xl sm:px-6">
            <FormAlert message={error} />

            {full ? (
              <div className="flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-500 sm:flex-row sm:items-center sm:justify-between">
                <p>This conversation is full. Start a new one to keep going.</p>
                <button type="button" onClick={newChat} className="btn-outline shrink-0 text-sm">
                  <Plus size={16} /> New chat
                </button>
              </div>
            ) : guestOut ? (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-muted">
                  <Lock size={15} /> You have used your guest messages. Create a free account to keep chatting.
                </p>
                <Link to="/register" className="btn-glow shrink-0 text-sm">
                  Create account
                </Link>
              </div>
            ) : (
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => send(input)}
                sending={sending}
                disabled={locked}
                maxChars={maxMessageChars}
                placeholder={`Ask in ${modeLabels[mode] ?? 'Standard'} mode. Enter to send, Shift + Enter for a new line.`}
                mic={{
                  supported: speechIn.supported,
                  listening: speechIn.listening,
                  interim: speechIn.interim,
                  error: speechIn.error,
                  onToggle: toggleMic,
                }}
                accent={{ value: voice.lang, options: accents, onChange: changeAccent }}
              />
            )}

            <p className="mt-3 text-center text-xs text-muted">
              ChemNova can make mistakes. Check important facts with your textbook or teacher.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function Companion() {
  const [attempt, setAttempt] = useState(0)
  const [boot, setBoot] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    Promise.all([getCompanionOptions(), listConversations()]).then(
      ([options, conversations]) => {
        if (!cancelled) setBoot({ status: 'ready', options, conversations })
      },
      (err) => {
        if (!cancelled) setBoot({ status: 'error', message: err.message })
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (boot.status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl" aria-busy="true" aria-label="Loading">
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <div className={`${block} hidden h-96 lg:block`} />
          <div className={`${block} h-[72vh]`} />
        </div>
      </div>
    )
  }

  if (boot.status === 'error') {
    return (
      <div className="mx-auto max-w-lg">
        <SpotlightCard className="p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertCircle size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">We could not load the Companion</h2>
          <p className="mt-1 text-sm text-muted">{boot.message}</p>
          <button
            onClick={() => {
              setBoot({ status: 'loading' })
              setAttempt((a) => a + 1)
            }}
            className="btn-glow mt-6"
          >
            <RefreshCw size={17} /> Try again
          </button>
        </SpotlightCard>
      </div>
    )
  }

  return <ChatView options={boot.options} initialConversations={boot.conversations} />
}