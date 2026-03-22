import { create } from 'zustand'

const STORAGE_KEYS = {
  API_KEY: 'piramyd_api_key',
  SETTINGS: 'piramyd_settings',
  CONVERSATIONS: 'piramyd_conversations',
  THEME: 'piramyd_theme',
}

const DEFAULT_SETTINGS = {
  model: '',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'Você é um assistente de IA útil, inteligente e amigável. Responda de forma clara e concisa.',
}

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore parse errors
  }
  return fallback
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage errors
  }
}

function loadApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || ''
  } catch {
    return ''
  }
}

function saveApiKey(key) {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key)
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY)
    }
  } catch {
    // ignore
  }
}

function loadTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME)
    if (stored) return stored
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'dark'
}

const useStore = create((set, get) => ({
  // ===== Theme =====
  theme: loadTheme(),
  setTheme: (theme) => {
    saveToStorage(STORAGE_KEYS.THEME, theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ theme })
  },
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(newTheme)
  },

  // ===== API Key =====
  apiKey: loadApiKey(),
  setApiKey: (apiKey) => {
    saveApiKey(apiKey)
    set({ apiKey })
  },

  // ===== Settings =====
  settings: loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  updateSettings: (updates) => {
    const newSettings = { ...get().settings, ...updates }
    saveToStorage(STORAGE_KEYS.SETTINGS, newSettings)
    set({ settings: newSettings })
  },
  resetSettings: () => {
    const currentModel = get().settings.model
    const resetted = { ...DEFAULT_SETTINGS, model: currentModel || '' }
    saveToStorage(STORAGE_KEYS.SETTINGS, resetted)
    set({ settings: resetted })
  },

  // ===== Available Models (fetched from API) =====
  availableModels: [],
  modelsLoading: false,
  modelsError: null,
  setAvailableModels: (models) => set({ availableModels: models, modelsLoading: false, modelsError: null }),
  setModelsLoading: (val) => set({ modelsLoading: val }),
  setModelsError: (err) => set({ modelsError: err, modelsLoading: false }),

  // ===== Conversations =====
  conversations: loadFromStorage(STORAGE_KEYS.CONVERSATIONS, []),
  activeConversationId: null,

  createConversation: () => {
    const id = crypto.randomUUID()
    const newConv = {
      id,
      title: 'Nova Conversa',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const conversations = [newConv, ...get().conversations]
    saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversations)
    set({ conversations, activeConversationId: id })
    return id
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id })
  },

  deleteConversation: (id) => {
    const conversations = get().conversations.filter((c) => c.id !== id)
    saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversations)
    const activeId = get().activeConversationId === id ? null : get().activeConversationId
    set({ conversations, activeConversationId: activeId })
  },

  clearAllConversations: () => {
    saveToStorage(STORAGE_KEYS.CONVERSATIONS, [])
    set({ conversations: [], activeConversationId: null })
  },

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get()
    return conversations.find((c) => c.id === activeConversationId) || null
  },

  addMessage: (conversationId, message) => {
    const conversations = get().conversations.map((c) => {
      if (c.id === conversationId) {
        const messages = [...c.messages, message]
        let title = c.title
        if (c.messages.length === 0 && message.role === 'user') {
          title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
        }
        return { ...c, messages, title, updatedAt: Date.now() }
      }
      return c
    })
    saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversations)
    set({ conversations })
  },

  updateLastAssistantMessage: (conversationId, content) => {
    const conversations = get().conversations.map((c) => {
      if (c.id === conversationId) {
        const messages = [...c.messages]
        const lastIdx = messages.length - 1
        if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
          messages[lastIdx] = { ...messages[lastIdx], content }
        }
        return { ...c, messages, updatedAt: Date.now() }
      }
      return c
    })
    saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversations)
    set({ conversations })
  },

  // ===== Streaming / Loading =====
  isStreaming: false,
  setIsStreaming: (val) => set({ isStreaming: val }),

  // ===== Sidebar =====
  sidebarOpen: false,
  setSidebarOpen: (val) => set({ sidebarOpen: val }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

  // ===== Settings Modal =====
  settingsOpen: false,
  setSettingsOpen: (val) => set({ settingsOpen: val }),
}))

export default useStore
export { DEFAULT_SETTINGS }
