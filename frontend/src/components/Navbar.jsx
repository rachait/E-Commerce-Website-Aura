import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { Menu, X, LogOut, ShoppingCart } from 'lucide-react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const isHome = location.pathname === '/'
  const navClasses = isHome
    ? 'fixed top-0 w-full z-50 bg-white/80 text-zinc-900 backdrop-blur-xl border-b border-zinc-200'
    : 'fixed top-0 w-full z-50 bg-black/85 text-zinc-100 backdrop-blur-xl border-b border-zinc-800'
  const linkClasses = isHome
    ? 'text-zinc-800 hover:text-zinc-500 transition duration-300'
    : 'text-zinc-100 hover:text-cyan-neon transition duration-300'
  const actionHoverClasses = isHome
    ? 'relative p-2 text-zinc-800 hover:text-zinc-500 transition'
    : 'relative p-2 text-zinc-100 hover:text-cyan-neon transition'
  const logoClasses = isHome
    ? 'font-display font-bold text-2xl text-zinc-900'
    : 'font-display font-bold text-2xl neon-text'

  const cartItemsCount = cart?.items?.length || 0

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className={logoClasses}>
            AURA
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/products/men" className={linkClasses}>
              Men
            </Link>
            <Link to="/products/women" className={linkClasses}>
              Women
            </Link>
            <Link to="/products/new-collection" className={linkClasses}>
              New
            </Link>
            <Link to="/products/featured" className={linkClasses}>
              Featured
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Cart Button */}
            <Link to="/cart" className={actionHoverClasses}>
              <ShoppingCart size={24} />
              {cartItemsCount > 0 && (
                <span className={`absolute top-0 right-0 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${isHome ? 'bg-zinc-900 text-white' : 'bg-cyan-neon text-dark-bg'}`}>
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Auth Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className={`text-sm hidden sm:inline ${isHome ? 'text-zinc-500' : 'text-zinc-300'}`}>{user?.name}</span>
                {user?.role === 'admin' && (
                  <Link to="/admin" className={isHome ? 'px-4 py-2 rounded-sm border border-zinc-300 hover:border-zinc-900 transition' : 'px-4 py-2 rounded-sm border border-zinc-700 text-zinc-100 hover:border-cyan-neon transition'}>
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className={isHome ? 'p-2 text-zinc-800 hover:text-zinc-500 transition' : 'p-2 text-zinc-100 hover:text-cyan-neon transition'}>
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/auth" className={isHome ? 'text-sm px-4 py-2 rounded-sm border border-zinc-300 hover:border-zinc-900 transition' : 'text-sm px-4 py-2 rounded-sm border border-zinc-700 text-zinc-100 hover:border-cyan-neon transition'}>
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2" 
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/products/men" className={isHome ? 'block py-2 text-zinc-800 hover:text-zinc-500' : 'block py-2 text-zinc-100 hover:text-cyan-neon'}>Men</Link>
            <Link to="/products/women" className={isHome ? 'block py-2 text-zinc-800 hover:text-zinc-500' : 'block py-2 text-zinc-100 hover:text-cyan-neon'}>Women</Link>
            <Link to="/products/new-collection" className={isHome ? 'block py-2 text-zinc-800 hover:text-zinc-500' : 'block py-2 text-zinc-100 hover:text-cyan-neon'}>New</Link>
            <Link to="/products/featured" className={isHome ? 'block py-2 text-zinc-800 hover:text-zinc-500' : 'block py-2 text-zinc-100 hover:text-cyan-neon'}>Featured</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
