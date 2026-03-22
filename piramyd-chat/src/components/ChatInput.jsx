import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
import useStore from '../store/useStore'

export default function ChatInput({ onSend, onStop }) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)
  const isStreaming = useStore((s) => s.isStreaming)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setInput('')
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, isStreaming, onSend])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className="border-t border-gray-200/50 dark:border-dark-800/50 bg-white/50 dark:bg-dark-950/50 backdrop-blur-xl p-5">
      <div className="max-w-3xl mx-auto">
        <div
          className="flex items-end gap-3 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md rounded-2xl border border-gray-200/80 dark:border-dark-800
            shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-dark-700
            focus-within:border-primary-400 dark:focus-within:border-primary-500 focus-within:shadow-md
            focus-within:ring-4 focus-within:ring-primary-500/10
            transition-all duration-300 px-4 py-3"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            rows={1}
            disabled={isStreaming}
            className="chat-textarea flex-1 bg-transparent border-none outline-none text-base
              text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
              disabled:opacity-50 py-1"
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              className="shrink-0 p-2.5 rounded-xl bg-gray-100 dark:bg-dark-800 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 text-gray-600 dark:text-gray-400
                transition-colors duration-200"
              aria-label="Parar geração"
            >
              <Square size={18} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="shrink-0 p-2.5 rounded-xl
                bg-primary-600 text-white
                hover:bg-primary-700 active:bg-primary-800
                disabled:opacity-40 disabled:hover:bg-primary-600 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm"
              aria-label="Enviar mensagem"
            >
              <Send size={18} />
            </button>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3 font-medium">
          Piramyd Chat pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  )
}
