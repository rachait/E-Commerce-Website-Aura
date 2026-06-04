import React, { useState, useEffect } from 'react'
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navClasses = `fixed top-0 w-full z-50 ${isHome && !scrolled ? 'bg-transparent text-white' : 'bg-black/90 text-zinc-100 backdrop-blur-sm border-b border-zinc-800'}`
  const linkClasses = `${isHome && !scrolled ? 'text-white/70 hover:text-white' : 'text-zinc-100 hover:text-white'} transition duration-300`
  const actionHoverClasses = `${isHome && !scrolled ? 'relative p-2 text-white/70 hover:text-white' : 'relative p-2 text-zinc-100 hover:text-white'} transition`
  const logoClasses = 'font-display font-light text-2xl tracking-[0.2em] text-white'

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
                <span className={`absolute top-0 right-0 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${isHome ? 'bg-zinc-900 text-white' : 'bg-zinc-900 text-white'}`}>
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Auth Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className={`text-sm hidden sm:inline ${isHome ? 'text-zinc-500' : 'text-zinc-300'}`}>{user?.name}</span>
                {user?.role === 'admin' && (
                  <Link to="/admin" className={isHome ? 'px-4 py-2 rounded-sm border border-zinc-300 hover:border-zinc-900 transition' : 'px-4 py-2 rounded-sm border border-zinc-700 text-zinc-100 hover:border-zinc-300 transition'}>
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className={isHome ? 'p-2 text-zinc-800 hover:text-zinc-500 transition' : 'p-2 text-zinc-100 hover:text-white/70 transition'}>
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/auth" className={isHome ? 'text-sm px-4 py-2 rounded-sm border border-zinc-300 hover:border-zinc-900 transition' : 'text-sm px-4 py-2 rounded-sm border border-zinc-700 text-zinc-100 hover:border-zinc-300 transition'}>
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
            <Link to="/products/men" className={isHome ? 'block py-2 text-zinc-800 hover:text-zinc-500' : 'block py-2 text-zinc-100 hover:text-white/70'}>Men</Link>
            <Link to="/products/women" className={isHome ? 'block py-2 text-zinc-800 hover:text-zinc-500' : 'block py-2 text-zinc-100 hover:text-white/70'}>Women</Link>
            <Link to="/products/new-collection" className={isHome ? 'block py-2 text-zinc-800 hover:text-zinc-500' : 'block py-2 text-zinc-100 hover:text-white/70'}>New</Link>
            <Link to="/products/featured" className={isHome ? 'block py-2 text-zinc-800 hover:text-zinc-500' : 'block py-2 text-zinc-100 hover:text-white/70'}>Featured</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
