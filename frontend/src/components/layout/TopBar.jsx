import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { LogOut, UserCircle2, Menu } from 'lucide-react'
import UserContext from '../../contexts/UserContext'
import { useContext } from 'react'

function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth0()
  const { currentUser } = useContext(UserContext)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const displayName = currentUser?.displayName || user?.nickname || 'Tempo User'
  console.log("[TOPBAR] Current user:", currentUser)
  console.log("[TOPBAR] Auth0 user:", user)
  const email = currentUser?.email || user?.email || 'No email available'

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">

      {/* Sidebar toggle only on mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Menu size={20} />
      </button>

      <NavLink to="/dashboard" className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
          <rect width="48" height="48" rx="10" fill="#4f46e5"/>
          <rect x="7" y="11" width="34" height="8" rx="4" fill="white"/>
          <rect x="7" y="21" width="25" height="8" rx="4" fill="white" opacity="0.6"/>
          <rect x="7" y="31" width="16" height="8" rx="4" fill="white" opacity="0.35"/>
        </svg>
        <span className="hidden sm:block text-xl font-semibold text-gray-900">Tempo</span>
      </NavLink>

      {/** User profile section */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full ring-indigo-200 transition duration-200 hover:ring-2 focus:outline-none focus:ring-2"
        >
          {user?.picture ? (
            <img
              src={user.picture}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="truncate text-xs text-gray-500">{email}</p>
            </div>

            <div className="p-1.5">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-100"
              >
                <UserCircle2 size={15} className="text-gray-500" />
                Profile
              </button>

              <button
                type="button"
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition-colors duration-200 hover:bg-rose-50"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default TopBar
