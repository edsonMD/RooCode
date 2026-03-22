import useStore from '../store/useStore'

export default function MobileOverlay() {
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)

  if (!sidebarOpen) return null

  return (
    <div
      onClick={() => setSidebarOpen(false)}
      className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden modal-backdrop"
      aria-hidden="true"
    />
  )
}
