
import { NavSection } from "@/shared/config/navigation.config"
import SidebarItem from "./SidebarItem"

interface SidebarProps {
  navigation: NavSection[]
  onLogout: () => void
}

export default function Sidebar({ navigation, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 bg-[hsl(235_11%_90%)] text-[#262426] border-r border-[hsl(235_11%_75%)] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[hsl(235_11%_75%)]">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Plataforma de aprendizaje</h1>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto">
        {navigation.map((section, idx) => (
          <div key={idx} className="p-4">
            <div className="text-xs font-semibold text-[#262426]/75 mb-3 uppercase tracking-wider">
              {section.title}
            </div>
            <nav className="space-y-1">
              {section.items.map((item, itemIdx) => (
                <SidebarItem key={itemIdx} item={item} />
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="mt-auto p-4 border-t border-[hsl(235_11%_75%)]">
        <button
          onClick={onLogout}
          className="w-full px-4 py-2.5 rounded-lg text-[#262426]/85 hover:bg-[#262426]/10 hover:text-[#262426] transition-colors text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}