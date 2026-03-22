import { useRef, useEffect, useCallback } from 'react'
import useStore from '../store/useStore'
import { sendChatRequest } from '../services/api'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import {
  Menu,
  Sparkles,
  MessageSquarePlus,
  Zap,
  Brain,
  Code2,
} from 'lucide-react'

export default function ChatArea() {
  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)

  const activeConversationId = useStore((s) => s.activeConversationId)
  const getActiveConversation = useStore((s) => s.getActiveConversation)
  const createConversation = useStore((s) => s.createConversation)
  const addMessage = useStore((s) => s.addMessage)
  const updateLastAssistantMessage = useStore((s) => s.updateLastAssistantMessage)
  const isStreaming = useStore((s) => s.isStreaming)
  const setIsStreaming = useStore((s) => s.setIsStreaming)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const apiKey = useStore((s) => s.apiKey)
  const settings = useStore((s) => s.settings)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)

  const conversation = getActiveConversation()
  const messages = conversation?.messages || []

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(
    async (content) => {
      if (!apiKey) {
        setSettingsOpen(true)
        return
      }

      let convId = activeConversationId
      if (!convId) {
        convId = createConversation()
      }

      // Add user message
      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      }
      addMessage(convId, userMessage)

      // Add empty assistant message for streaming
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }
      addMessage(convId, assistantMessage)

      // Start streaming
      setIsStreaming(true)
      let accumulated = ''

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // Get current messages for API
      const currentConv = useStore.getState().conversations.find((c) => c.id === convId)
      const apiMessages = currentConv
        ? currentConv.messages.filter((m) => m.role !== 'error').slice(0, -1) // exclude the empty assistant msg
        : [userMessage]

      await sendChatRequest({
        messages: apiMessages,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        systemPrompt: settings.systemPrompt,
        apiKey,
        signal: abortController.signal,
        onChunk: (chunk) => {
          accumulated += chunk
          updateLastAssistantMessage(convId, accumulated)
        },
        onDone: () => {
          setIsStreaming(false)
          abortControllerRef.current = null
        },
        onError: (errorMsg) => {
          setIsStreaming(false)
          abortControllerRef.current = null
          // Replace empty assistant message with error
          if (!accumulated) {
            // Remove the empty assistant msg and add error
            const state = useStore.getState()
            const convs = state.conversations.map((c) => {
              if (c.id === convId) {
                const msgs = [...c.messages]
                // Replace last message (empty assistant) with error
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  role: 'error',
                  content: errorMsg,
                }
                return { ...c, messages: msgs }
              }
              return c
            })
            useStore.setState({ conversations: convs })
            try {
              localStorage.setItem('piramyd_conversations', JSON.stringify(convs))
            } catch {}
          }
        },
      })
    },
    [
      activeConversationId,
      apiKey,
      settings,
      addMessage,
      createConversation,
      setIsStreaming,
      setSettingsOpen,
      updateLastAssistantMessage,
    ]
  )

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [setIsStreaming])

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 bg-white/70 dark:bg-dark-950/70 backdrop-blur-sm">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-dark-800/50 bg-white/50 dark:bg-dark-950/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
              <Sparkles size={16} className="text-primary-600 dark:text-primary-400" />
            </div>
            <span className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
              {conversation ? conversation.title : 'Piramyd Chat'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100/80 dark:bg-dark-800/80 border border-gray-200/50 dark:border-dark-700/50 px-3 py-1.5 rounded-xl">
            <Zap size={14} className="text-primary-500" />
            {settings.model}
          </span>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSend={handleSend} />
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-4 px-4 py-6">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm flex items-center justify-center shrink-0 mt-1">
                  <Sparkles size={16} className="text-white animate-pulse" />
                </div>
                <div className="bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm rounded-2xl rounded-tl-sm px-5 py-4 border border-gray-200/50 dark:border-dark-800/50 shadow-sm">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSend={handleSend} onStop={handleStop} />
    </main>
  )
}

function WelcomeScreen({ onSend }) {
  const suggestions = [
    {
      icon: <Code2 size={20} />,
      title: 'Escreva um código',
      prompt: 'Escreva uma função em Python que calcule a sequência de Fibonacci',
    },
    {
      icon: <Brain size={20} />,
      title: 'Explique um conceito',
      prompt: 'Explique como funciona o algoritmo de busca binária de forma simples',
    },
    {
      icon: <Sparkles size={20} />,
      title: 'Crie uma história',
      prompt: 'Escreva uma curta história criativa sobre uma IA que descobre emoções',
    },
    {
      icon: <MessageSquarePlus size={20} />,
      title: 'Ajude a analisar',
      prompt: 'Quais são as melhores práticas para segurança em aplicações web modernas?',
    },
  ]

  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="max-w-3xl w-full mx-auto px-6 py-12">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-6 shadow-xl shadow-primary-500/20 ring-4 ring-primary-50 dark:ring-primary-900/20">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Bem-vindo ao Piramyd Chat
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base max-w-md">
            Sua interface inteligente para modelos de IA. Como posso ajudá-lo hoje?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSend(s.prompt)}
              className="group flex items-start gap-4 p-5 rounded-2xl
                bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border border-gray-200/80 dark:border-dark-800
                hover:border-primary-300 dark:hover:border-primary-500/40
                hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-0.5
                transition-all duration-300 text-left"
            >
              <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-500/20 transition-colors shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 mb-1">{s.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {s.prompt}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
