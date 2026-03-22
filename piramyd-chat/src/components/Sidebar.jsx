import useStore from '../store/useStore'
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Sun,
  Moon,
  X,
  Eraser,
} from 'lucide-react'

export default function Sidebar() {
  const conversations = useStore((s) => s.conversations)
  const activeConversationId = useStore((s) => s.activeConversationId)
  const createConversation = useStore((s) => s.createConversation)
  const setActiveConversation = useStore((s) => s.setActiveConversation)
  const deleteConversation = useStore((s) => s.deleteConversation)
  const clearAllConversations = useStore((s) => s.clearAllConversations)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const isStreaming = useStore((s) => s.isStreaming)

  const handleNewChat = () => {
    if (isStreaming) return
    createConversation()
    setSidebarOpen(false)
  }

  const handleSelectChat = (id) => {
    if (isStreaming) return
    setActiveConversation(id)
    setSidebarOpen(false)
  }

  const handleDeleteChat = (e, id) => {
    e.stopPropagation()
    if (isStreaming) return
    deleteConversation(id)
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 86400000) return 'Hoje'
    if (diff < 172800000) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <aside
      className={`
        fixed lg:relative z-40 h-full
        w-72 flex flex-col
        bg-gray-50/50 dark:bg-dark-950/50 backdrop-blur-xl border-r border-gray-200/50 dark:border-dark-800/50
        sidebar-transition
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200/50 dark:border-dark-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/20 flex items-center justify-center">
            <span className="text-white font-bold text-base">P</span>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Piramyd
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          disabled={isStreaming}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
            bg-primary-600 text-white
            hover:bg-primary-700 active:bg-primary-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg shadow-primary-600/20
            font-medium text-sm"
        >
          <Plus size={18} />
          Nova Conversa
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p>Nenhuma conversa ainda</p>
            <p className="text-xs mt-1">Clique em "Nova Conversa" para começar</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectChat(conv.id)}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer
                  transition-all duration-200 text-sm
                  ${
                    conv.id === activeConversationId
                      ? 'bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-200 dark:border-dark-700'
                      : 'hover:bg-white/50 dark:hover:bg-dark-800/50 text-gray-600 dark:text-gray-400 border border-transparent'
                  }
                `}
              >
                <div className={`p-2 rounded-lg ${conv.id === activeConversationId ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-dark-800 group-hover:bg-white dark:group-hover:bg-dark-700'}`}>
                  <MessageSquare size={16} className={conv.id === activeConversationId ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900 dark:text-gray-100">{conv.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(conv.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, conv.id)}
                  className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100
                    hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-500
                    transition-all duration-150"
                  aria-label="Excluir conversa"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/50 dark:border-dark-800/50 space-y-1">
        {conversations.length > 0 && (
          <button
            onClick={clearAllConversations}
            disabled={isStreaming}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-gray-600 dark:text-gray-400
              hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200"
          >
            <Eraser size={18} />
            Limpar Conversas
          </button>
        )}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-gray-600 dark:text-gray-400
            hover:bg-white dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-sm
            transition-all duration-200"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-gray-600 dark:text-gray-400
            hover:bg-white dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-sm
            transition-all duration-200"
        >
          <Settings size={18} />
          Configurações
        </button>
      </div>
    </aside>
  )
}
