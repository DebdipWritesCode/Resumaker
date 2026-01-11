import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/store'
import { clearAccessToken } from '@/store/slices/authSlice'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, ChevronLeft, LayoutDashboard, LogOut, FolderOpen, FileText, History, User, Lightbulb } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ThemeToggle from '@/components/ThemeToggle'

const DashboardLayout = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const userName = useSelector((state: RootState) => state.auth.name)
  const userEmail = useSelector((state: RootState) => state.auth.email)

  const getInitials = (name: string | null) => {
    if (!name) return 'US'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const handleLogout = () => {
    dispatch(clearAccessToken())
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        getInitials={getInitials}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <main className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[300px]'}`}>
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <Outlet />
      </main>
    </div>
  )
}

const Sidebar = ({
  userName,
  userEmail,
  getInitials,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}: {
  userName: string | null
  userEmail: string | null
  getInitials: (name: string | null) => string
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}) => {
  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="fixed top-4 left-4 z-50 lg:hidden">
          <Button
            variant="outline"
            className="p-2 h-10 sm:h-14 text-lg flex items-center justify-center gap-2 shadow-md"
          >
            <Menu size={20} />
            <p className="hidden sm:block">See Menu</p>
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-[300px] p-0">
          <SidebarContent
            userName={userName}
            userEmail={userEmail}
            getInitials={getInitials}
            onNavigate={() => setIsOpen(false)}
            isCollapsed={false}
            onToggleCollapse={() => {}}
          />
        </SheetContent>
      </Sheet>

      <div
        className={`hidden lg:block fixed left-0 top-0 h-full border-r bg-white dark:bg-card transition-all duration-300 ${
          isCollapsed ? 'w-[80px]' : 'w-[300px]'
        }`}
      >
        <SidebarContent
          userName={userName}
          userEmail={userEmail}
          getInitials={getInitials}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>
    </>
  )
}

const SidebarContent = ({
  userName,
  userEmail,
  getInitials,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}: {
  userName: string | null
  userEmail: string | null
  getInitials: (name: string | null) => string
  onNavigate?: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}) => {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className={`border-b ${isCollapsed ? 'px-2 py-4' : 'px-6 py-4'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <SheetHeader>
              <h1 className="text-3xl text-blue-900 dark:text-blue-100 font-normal font-heading">
                Resumaker
              </h1>
            </SheetHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-5 w-5 sm:block hidden" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="shrink-0"
              aria-label="Expand sidebar"
            >
              <ChevronLeft className="h-5 w-5 rotate-180 sm:block hidden" />
            </Button>
            <h1 className="text-2xl text-blue-900 dark:text-blue-100 font-normal font-heading">
              RM
            </h1>
          </div>
        )}
      </div>

      <nav className={`flex-1 ${isCollapsed ? 'px-2 py-4' : 'px-6 py-4'}`}>
        <ul className="space-y-4">
          <li>
            <Button
              asChild
              variant="ghost"
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'}`}
              onClick={onNavigate}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <Link to="/dashboard" className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Dashboard</span>}
              </Link>
            </Button>
          </li>
          <li>
            <Button
              asChild
              variant="ghost"
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'}`}
              onClick={onNavigate}
              title={isCollapsed ? 'My Elements' : undefined}
            >
              <Link to="/my-elements" className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>My Elements</span>}
              </Link>
            </Button>
          </li>
          <li>
            <Button
              asChild
              variant="ghost"
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'}`}
              onClick={onNavigate}
              title={isCollapsed ? 'Make Resume' : undefined}
            >
              <Link to="/make-resume" className="flex items-center gap-3">
                <FileText className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Make Resume</span>}
              </Link>
            </Button>
          </li>
          <li>
            <Button
              asChild
              variant="ghost"
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'}`}
              onClick={onNavigate}
              title={isCollapsed ? 'History' : undefined}
            >
              <Link to="/history" className="flex items-center gap-3">
                <History className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>History</span>}
              </Link>
            </Button>
          </li>
          <li>
            <Button
              asChild
              variant="ghost"
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'}`}
              onClick={onNavigate}
              title={isCollapsed ? 'My Profile' : undefined}
            >
              <Link to="/my-profile" className="flex items-center gap-3">
                <User className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>My Profile</span>}
              </Link>
            </Button>
          </li>
          <li>
            <Button
              asChild
              variant="ghost"
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'}`}
              onClick={onNavigate}
              title={isCollapsed ? 'Resume Tips' : undefined}
            >
              <Link to="/resume-tips" className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Resume Tips</span>}
              </Link>
            </Button>
          </li>
        </ul>
      </nav>

      <SheetFooter
        className={`border-t ${
          isCollapsed ? 'px-2 py-4' : 'px-6 py-4'
        }`}
      >
        <div
          className={`flex items-center gap-3 w-full ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <Avatar className="shrink-0">
            <AvatarImage src="" />
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="font-medium truncate">{userName || 'User'}</p>
              <p className="text-sm text-muted-foreground truncate">
                {userEmail || 'No email'}
              </p>
            </div>
          )}
        </div>
      </SheetFooter>
    </div>
  )
}

export default DashboardLayout
