import { memo, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import DOMPurify from 'dompurify'
import { User, Bot, Copy, Check } from 'lucide-react'

function CodeBlock({ children, className, ...props }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const codeString = String(children).replace(/\n$/, '')

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = codeString
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [codeString])

  if (!match) {
    // Inline code
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className="code-block-wrapper bg-gray-900 dark:bg-black/40 border border-gray-700 dark:border-dark-700">
      <div className="code-block-header bg-gray-800 dark:bg-dark-800 text-gray-400 border-b border-gray-700 dark:border-dark-700">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md
            hover:bg-gray-700 dark:hover:bg-dark-700 transition-colors text-xs"
          aria-label="Copiar código"
        >
          {copied ? (
            <>
              <Check size={13} className="text-green-400" />
              <span className="text-green-400">Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre className="text-gray-100">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  // Sanitize content before rendering
  // Removendo DOMPurify temporariamente para permitir que o ReactMarkdown renderize corretamente
  const renderContent = message.content

  return (
    <div
      className={`flex gap-4 px-4 py-6 animate-fade-in border-b border-transparent hover:border-gray-100 dark:hover:border-dark-800/50 transition-colors ${
        isUser
          ? 'justify-end'
          : 'justify-start bg-gray-50/50 dark:bg-dark-900/20'
      }`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm flex items-center justify-center mt-1">
          <Bot size={16} className="text-white" />
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-[85%] lg:max-w-[75%] ${
          isUser
            ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-sm'
            : isError
            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl rounded-tl-sm px-5 py-3.5 border border-red-200/50 dark:border-red-500/20'
            : 'text-gray-800 dark:text-gray-200'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
        ) : isError ? (
          <p className="text-[15px] leading-relaxed">{message.content}</p>
        ) : (
          <div className="markdown-body text-[15px] leading-relaxed prose-pre:my-0 prose-pre:bg-transparent">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: CodeBlock,
              }}
            >
              {renderContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-gray-200 dark:bg-dark-700 flex items-center justify-center shadow-sm mt-1">
          <User size={16} className="text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  )
}

export default memo(MessageBubble)
