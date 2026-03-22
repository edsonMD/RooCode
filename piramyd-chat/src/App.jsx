import { useEffect } from 'react'
import useStore from './store/useStore'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import SettingsModal from './components/SettingsModal'
import MobileOverlay from './components/MobileOverlay'
import Background3D from './components/Background3D'

export default function App() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)

  // Apply theme on mount
  useEffect(() => {
    setTheme(theme)
  }, [])

  return (
    <div className={`h-screen w-screen flex overflow-hidden bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300 relative`}>
      {/* 3D Background */}
      <Background3D />
      
      {/* Subtle Vignette Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)] mix-blend-multiply dark:mix-blend-normal"></div>

      {/* Sidebar */}
      <Sidebar />

      {/* Mobile Overlay */}
      <MobileOverlay />

      {/* Main Chat Area */}
      <ChatArea />

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  )
}
