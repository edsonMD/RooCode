import { useState, useEffect } from 'react'
import useStore, { DEFAULT_SETTINGS } from '../store/useStore'
import {
  X,
  Eye,
  EyeOff,
  RotateCcw,
  Key,
  Cpu,
  Thermometer,
  Hash,
  FileText,
  Save,
} from 'lucide-react'

export default function SettingsModal() {
  const settingsOpen = useStore((s) => s.settingsOpen)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const apiKey = useStore((s) => s.apiKey)
  const setApiKey = useStore((s) => s.setApiKey)
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const resetSettings = useStore((s) => s.resetSettings)
  const availableModels = useStore((s) => s.availableModels)

  const [localKey, setLocalKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [localSettings, setLocalSettings] = useState({ ...settings })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settingsOpen) {
      setLocalKey(apiKey)
      setLocalSettings({ ...settings })
      setShowKey(false)
      setSaved(false)
    }
  }, [settingsOpen, apiKey, settings])

  const handleSave = () => {
    setApiKey(localKey.trim())
    updateSettings(localSettings)
    setSaved(true)
    setTimeout(() => {
      setSettingsOpen(false)
      setSaved(false)
    }, 800)
  }

  const handleReset = () => {
    setLocalSettings({ ...DEFAULT_SETTINGS })
  }

  if (!settingsOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSettingsOpen(false)
      }}
    >
      <div className="bg-black/50 backdrop-blur-sm absolute inset-0" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-2xl shadow-2xl
          border border-gray-200 dark:border-dark-700 overflow-hidden modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Cpu size={16} className="text-white" />
            </div>
            Configurações
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              <Key size={15} className="text-indigo-500" />
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-gray-50 dark:bg-dark-800
                  border border-gray-200 dark:border-dark-700
                  focus:border-indigo-400 dark:focus:border-indigo-500
                  focus:ring-2 focus:ring-indigo-500/20
                  outline-none transition-all text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              🔒 Armazenada apenas no localStorage do seu navegador. Nunca enviada para terceiros.
            </p>
          </div>

          {/* Model Selector */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              <Cpu size={15} className="text-indigo-500" />
              Modelo
            </label>
            <select
              value={localSettings.model}
              onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-800
                border border-gray-200 dark:border-dark-700
                focus:border-indigo-400 dark:focus:border-indigo-500
                focus:ring-2 focus:ring-indigo-500/20
                outline-none transition-all text-sm appearance-none
                cursor-pointer"
            >
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-2">
                <Thermometer size={15} className="text-indigo-500" />
                Temperature
              </span>
              <span className="text-indigo-500 font-mono text-xs bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                {localSettings.temperature.toFixed(1)}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
              }
              className="w-full bg-gray-200 dark:bg-dark-700 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Preciso (0.0)</span>
              <span>Criativo (2.0)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-2">
                <Hash size={15} className="text-indigo-500" />
                Max Tokens
              </span>
              <span className="text-indigo-500 font-mono text-xs bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                {localSettings.maxTokens.toLocaleString()}
              </span>
            </label>
            <input
              type="range"
              min="256"
              max="32768"
              step="256"
              value={localSettings.maxTokens}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })
              }
              className="w-full bg-gray-200 dark:bg-dark-700 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>256</span>
              <span>32.768</span>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              <FileText size={15} className="text-indigo-500" />
              System Prompt
            </label>
            <textarea
              value={localSettings.systemPrompt}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, systemPrompt: e.target.value })
              }
              placeholder="Instruções do sistema para a IA..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-800
                border border-gray-200 dark:border-dark-700
                focus:border-indigo-400 dark:focus:border-indigo-500
                focus:ring-2 focus:ring-indigo-500/20
                outline-none transition-all text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/50">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm
              text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
              hover:bg-gray-100 dark:hover:bg-dark-700 transition-all"
          >
            <RotateCcw size={14} />
            Resetar
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200 shadow-lg
              ${
                saved
                  ? 'bg-green-500 text-white shadow-green-500/25'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/25'
              }`}
          >
            <Save size={14} />
            {saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
