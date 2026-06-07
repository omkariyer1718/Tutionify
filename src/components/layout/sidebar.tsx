'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  IndianRupee,
  ClipboardCheck,
  Trophy,
  GraduationCap,
  BookOpen,
  Settings,
  LogOut,
  ChevronLeft,
  BookOpenText,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Timetable', href: '/timetable', icon: Calendar },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Fees', href: '/fees', icon: IndianRupee },
  { name: 'Attendance', href: '/attendance', icon: ClipboardCheck },
  { name: 'Scores', href: '/scores', icon: Trophy },
  { name: 'Passed Out', href: '/passed-out', icon: GraduationCap },
  { name: 'Textbooks', href: '/textbooks', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-gray-200 shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <BookOpenText className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-semibold text-gray-900 truncate">Tutionify</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn('w-4.5 h-4.5 shrink-0', isActive ? 'text-indigo-600' : 'text-gray-400')} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200 p-2 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors"
        >
          <ChevronLeft
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-700 w-full transition-colors"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
