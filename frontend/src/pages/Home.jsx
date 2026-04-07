import React, { useState, useEffect, Suspense, lazy, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { productsAPI, aiAPI } from '../utils/api'
import ProductCard from '../components/ProductCard'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionTemplate } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProductImageCandidates } from '../utils/images'
import {
  getExperimentVariant,
  trackExperimentExposure,
  trackExperimentConversion
} from '../utils/experiments'

const IntroScene = lazy(() => import('../3d/IntroScene'))
const ProductViewer = lazy(() => import('../3d/ProductViewer'))

const SVG_PLACEHOLDER = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="100%" height="100%" fill="#111827"/><text x="50%" y="50%" fill="#e5e7eb" font-size="42" text-anchor="middle" dominant-baseline="middle" font-family="Arial">AURA</text></svg>'
)
const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${SVG_PLACEHOLDER}`
const INTRO_SESSION_KEY = 'home-cinematic-intro-seen-v1'

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')

const tokenize = (value) => normalizeText(value).split(/\s+/).filter(Boolean)

const hasAnyToken = (tokens, candidates) => candidates.some((candidate) => tokens.includes(candidate))

const isClothingProduct = (product) => {
  const category = normalizeText(product?.category)
  return ['fashion', 'clothing', 'apparel'].some((term) => category.includes(term))
}

const isMenClothing = (product) => {
  const genderTokens = tokenize(`${product?.subcategory || ''} ${product?.category || ''}`)
  const hasMenToken = hasAnyToken(genderTokens, ['men', 'mens', 'male'])
  const hasWomenToken = hasAnyToken(genderTokens, ['women', 'womens', 'female', 'ladies'])
  return isClothingProduct(product) && hasMenToken && !hasWomenToken
}

const isWomenClothing = (product) => {
  const genderTokens = tokenize(`${product?.subcategory || ''} ${product?.category || ''}`)
  const hasWomenToken = hasAnyToken(genderTokens, ['women', 'womens', 'female', 'ladies'])
  return isClothingProduct(product) && hasWomenToken
}

const FALLBACK_PRODUCTS = [
  {
    id: 'fallback-1',
    name: 'Men Tailored Jacket',
    category: 'men',
    description: 'Modern cut jacket for evening and office edits.',
    price: 4599,
    originalPrice: 5999,
    stock: 16,
    featured: true,
    sizes: ['S', 'M', 'L', 'XL'],
    images: [FALLBACK_IMAGE]
  },
  {
    id: 'fallback-2',
    name: 'Women Sculpted Blazer',
    category: 'women',
    description: 'Sharp silhouette with clean structure and comfort.',
    price: 4999,
    originalPrice: 6499,
    stock: 14,
    featured: true,
    sizes: ['XS', 'S', 'M', 'L'],
    images: [FALLBACK_IMAGE]
  },
  {
    id: 'fallback-3',
    name: 'New Season Trench',
    category: 'new',
    description: 'Lightweight trench with fluid drape and movement.',
    price: 6299,
    originalPrice: 7599,
    stock: 9,
    featured: true,
    sizes: ['M', 'L', 'XL'],
    images: [FALLBACK_IMAGE]
  },
  {
    id: 'fallback-4',
    name: 'Leather Accessories Set',
    category: 'accessories',
    description: 'Minimal accessories collection with matte hardware.',
    price: 2399,
    originalPrice: 3199,
    stock: 28,
    featured: false,
    sizes: ['One Size'],
    images: [FALLBACK_IMAGE]
  },
  {
    id: 'fallback-5',
    name: 'Men Relaxed Trousers',
    category: 'men',
    description: 'Wide-leg fit made for daily movement.',
    price: 2999,
    originalPrice: 3799,
    stock: 22,
    featured: false,
    sizes: ['S', 'M', 'L'],
    images: [FALLBACK_IMAGE]
  },
  {
    id: 'fallback-6',
    name: 'Women Knit Dress',
    category: 'women',
    description: 'Soft knit with contemporary neckline and flow.',
    price: 3199,
    originalPrice: 4099,
    stock: 11,
    featured: true,
    sizes: ['XS', 'S', 'M'],
    images: [FALLBACK_IMAGE]
  },
  {
    id: 'fallback-7',
    name: 'New Utility Shirt',
    category: 'new',
    description: 'Crisp cotton shirt with hidden placket details.',
    price: 2199,
    originalPrice: 2899,
    stock: 30,
    featured: false,
    sizes: ['S', 'M', 'L', 'XL'],
    images: [FALLBACK_IMAGE]
  },
  {
    id: 'fallback-8',
    name: 'Featured Mono Set',
    category: 'featured',
    description: 'High-street monochrome edit curated by AURA.',
    price: 5399,
    originalPrice: 6799,
    stock: 7,
    featured: true,
    sizes: ['S', 'M', 'L'],
    images: [FALLBACK_IMAGE]
  }
]

// Loading Skeleton Component
const ProductSkeleton = () => (
  <motion.div
    animate={{ opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className="space-y-4"
  >
    <div className="h-80 bg-zinc-200 rounded-sm" />
    <div className="h-6 bg-zinc-200 rounded w-3/4" />
    <div className="h-4 bg-zinc-200 rounded w-1/2" />
    <div className="h-5 bg-zinc-200 rounded w-1/3" />
  </motion.div>
)

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [catalogNotice, setCatalogNotice] = useState('')
  const [activeTab, setActiveTab] = useState('men')
  const heroExperimentKey = 'home-hero-cta-copy-v1'
  const heroVariant = useMemo(
    () =>
      getExperimentVariant({
        experimentKey: heroExperimentKey,
        variants: ['control', 'high-contrast-copy'],
        userId: user?.id,
        gateFlag: 'enableHomepageHeroExperiment'
      }),
    [user?.id]
  )

  const storyRef = useRef(null)
  const homeRef = useRef(null)
  const [activeSection, setActiveSection] = useState('hero')
  const [showIntro, setShowIntro] = useState(false)
  const [introBootstrapped, setIntroBootstrapped] = useState(false)
  const [introQuality, setIntroQuality] = useState('high')

  const scrollChapters = useMemo(
    () => [
      { id: 'hero', label: 'Hero' },
      { id: 'feed', label: 'Feed' },
      { id: 'story', label: 'Story' },
      { id: 'editorial', label: 'Editorial' },
      { id: 'featured', label: 'Featured' },
      { id: 'lab', label: '3D Lab' },
      { id: 'category', label: 'Category' },
      { id: 'cta', label: 'CTA' }
    ],
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const seenIntro = sessionStorage.getItem(INTRO_SESSION_KEY) === '1'
    const isMobile = window.innerWidth < 768
    const lowCpu = (navigator.hardwareConcurrency || 8) < 6
    const lowMemory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory < 6 : false

    if (prefersReducedMotion || lowCpu || lowMemory || isMobile) {
      setIntroQuality('balanced')
    }

    setShowIntro(!prefersReducedMotion && !seenIntro)
    setIntroBootstrapped(true)
  }, [])

  useEffect(() => {
    if (!showIntro || typeof window === 'undefined') {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      sessionStorage.setItem(INTRO_SESSION_KEY, '1')
      setShowIntro(false)
    }, 4200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [showIntro])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    if (showIntro) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = originalOverflow || ''
    }

    return () => {
      document.body.style.overflow = originalOverflow || ''
    }
  }, [showIntro])

  useEffect(() => {
    if (!homeRef.current || typeof IntersectionObserver === 'undefined') {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visibleSection?.target?.dataset?.scrollSection) {
          setActiveSection(visibleSection.target.dataset.scrollSection)
        }
      },
      {
        root: homeRef.current,
        threshold: [0.25, 0.5, 0.7],
        rootMargin: '-8% 0px -30% 0px'
      }
    )

    const sections = homeRef.current.querySelectorAll('[data-scroll-section]')
    sections.forEach((section) => observer.observe(section))

    return () => {
      sections.forEach((section) => observer.unobserve(section))
      observer.disconnect()
    }
  }, [scrollChapters])

  useEffect(() => {
    trackExperimentExposure(heroExperimentKey, heroVariant, {
      page: 'home'
    })
  }, [heroExperimentKey, heroVariant])

  const editorialTiles = [
    {
      id: 'tile-01',
      title: 'Modern Tailoring',
      subtitle: 'Sharp cuts for everyday city movement',
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=1000&fit=crop'
    },
    {
      id: 'tile-02',
      title: 'Soft Utility',
      subtitle: 'Layered textures in neutral gradients',
      image: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=800&h=1000&fit=crop'
    },
    {
      id: 'tile-03',
      title: 'After Hours',
      subtitle: 'Polished evening edits with fluid lines',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1000&fit=crop'
    }
  ]

  const categories = [
    { name: 'Fashion', link: '/products/fashion', image: FALLBACK_IMAGE, count: '50+' },
    { name: 'Footwear', link: '/products/footwear', image: FALLBACK_IMAGE, count: '25+' },
    { name: 'Accessories', link: '/products/accessories', image: FALLBACK_IMAGE, count: '40+' },
    { name: 'Bags', link: '/products/bags', image: FALLBACK_IMAGE, count: '30+' },
    { name: 'Makeup', link: '/products/makeup', image: FALLBACK_IMAGE, count: '35+' }
  ]

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setCatalogNotice('')

        const [featuredRes, allRes] = await Promise.allSettled([
          productsAPI.getFeatured(12),
          productsAPI.getAll(null, null, 50, 0)
        ])

        const featuredData =
          featuredRes.status === 'fulfilled' && Array.isArray(featuredRes.value.data)
            ? featuredRes.value.data
            : []
        const allData =
          allRes.status === 'fulfilled' && Array.isArray(allRes.value.data)
            ? allRes.value.data
            : []

        setAllProducts(allData.length ? allData : FALLBACK_PRODUCTS)
        setFeaturedProducts(
          featuredData.length ? featuredData : FALLBACK_PRODUCTS.filter((product) => product.featured).slice(0, 12)
        )

        if (!featuredData.length && !allData.length) {
          setCatalogNotice('Showing curated products while live catalog is connecting.')
        }
      } catch (err) {
        console.error('Failed to fetch products:', err)
        setAllProducts(FALLBACK_PRODUCTS)
        setFeaturedProducts(FALLBACK_PRODUCTS.filter((product) => product.featured).slice(0, 12))
        setCatalogNotice('Showing curated products while live catalog is connecting.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchPersonalized = async () => {
      if (!isAuthenticated || !user?.id) {
        setRecommendedProducts([])
        setRecentlyViewedProducts([])
        return
      }

      try {
        const [recoRes, recentRes] = await Promise.all([
          aiAPI.getRecommendations(user.id, 6),
          aiAPI.getRecentlyViewed(6)
        ])

        const recommendations = Array.isArray(recoRes.data?.recommendations) ? recoRes.data.recommendations : []
        const recent = Array.isArray(recentRes.data?.products) ? recentRes.data.products : []

        const toProductCardShape = (product) => ({
          ...product,
          images: product.images || (product.image ? [product.image] : []),
          description: product.description || 'Curated for your style preferences.',
          stock: product.stock ?? 10,
          sizes: product.sizes || ['S', 'M', 'L']
        })

        setRecommendedProducts(recommendations.map(toProductCardShape))
        setRecentlyViewedProducts(recent.map(toProductCardShape))
      } catch (error) {
        setRecommendedProducts([])
        setRecentlyViewedProducts([])
      }
    }

    fetchPersonalized()
  }, [isAuthenticated, user?.id])

  // Tab categories
  const tabCategories = [
    { id: 'men', label: 'Men' },
    { id: 'women', label: 'Women' },
    { id: 'new', label: 'New' },
    { id: 'featured', label: 'Featured' }
  ]

  // Normalize and filter products
  const normalizedProducts = useMemo(() => {
    return allProducts.map((product) => ({
      ...product,
      category: String(product.category || 'new').toLowerCase(),
      subcategory: String(product.subcategory || '').toLowerCase(),
      price: typeof product.price === 'string' ? parseInt(product.price) : product.price,
      searchable: `${product.name || ''} ${product.description || ''} ${product.category || ''} ${product.subcategory || ''}`.toLowerCase(),
      createdAtTs: product.createdAt ? new Date(product.createdAt).getTime() : 0
    }))
  }, [allProducts])

  const tabbedProducts = useMemo(() => {
    if (activeTab === 'featured') {
      return normalizedProducts.filter((product) => product.featured).slice(0, 8)
    }

    if (activeTab === 'new') {
      return [...normalizedProducts]
        .sort((a, b) => b.createdAtTs - a.createdAtTs)
        .slice(0, 8)
    }

    if (activeTab === 'men') {
      return normalizedProducts.filter(isMenClothing).slice(0, 8)
    }

    if (activeTab === 'women') {
      return normalizedProducts.filter(isWomenClothing).slice(0, 8)
    }

    const matched = normalizedProducts.filter(
      (product) => product.category.includes(activeTab) || product.searchable.includes(activeTab)
    )

    return matched.slice(0, 8)
  }, [activeTab, normalizedProducts])

  const runwayProducts = useMemo(() => {
    return featuredProducts.slice(0, 8).length > 0
      ? featuredProducts.slice(0, 8)
      : normalizedProducts.slice(0, 8)
  }, [featuredProducts, normalizedProducts])

  const expandedProductFeed = useMemo(() => {
    return featuredProducts.length > 0 ? featuredProducts.slice(0, 12) : normalizedProducts.slice(0, 12)
  }, [featuredProducts, normalizedProducts])

  // Scroll parallax
  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ['start end', 'end start']
  })
  const { scrollYProgress: homeScrollProgress } = useScroll({
    container: homeRef
  })
  const homeScrollScaleX = useSpring(homeScrollProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.2
  })
  const ambientHue = useTransform(homeScrollProgress, [0, 1], [198, 346])
  const ambientPosition = useTransform(homeScrollProgress, [0, 1], ['18%', '82%'])
  const ambientGradient = useMotionTemplate`radial-gradient(circle at ${ambientPosition} 20%, hsla(${ambientHue}, 98%, 72%, 0.22), transparent 48%)`
  const storyImageY = useTransform(scrollYProgress, [0, 1], [80, -80])
  const storyPanelY = useTransform(scrollYProgress, [0, 1], [24, -24])
  const heroCopy =
    heroVariant === 'high-contrast-copy'
      ? {
          title: 'Built For Rush Hour. Ready For Spotlight.',
          subtitle:
            'Performance fabrics, sharp silhouettes, and runway-level detail built for daily movement.',
          cta: 'Shop The New Drop'
        }
      : {
          title: 'Minimal silhouettes, sharp tailoring, and motion-led storytelling.',
          subtitle: 'Discover pieces designed to move with your day.',
          cta: 'Explore Collection'
        }

  const handleHeroClick = () => {
    trackExperimentConversion(heroExperimentKey, heroVariant, 'hero_cta_click', {
      target: '/products/featured'
    })
  }

  const dismissIntro = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(INTRO_SESSION_KEY, '1')
    }
    setShowIntro(false)
  }

  const scrollToChapter = useCallback((chapterId) => {
    if (!homeRef.current) {
      return
    }

    const section = homeRef.current.querySelector(`[data-scroll-section="${chapterId}"]`)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <>
      <AnimatePresence>
        {introBootstrapped && showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="fixed inset-0 z-[90] overflow-hidden bg-[#05070b]"
          >
            <div className="absolute inset-0">
              <Suspense fallback={<div className="h-full w-full bg-[#05070b]" />}>
                <IntroScene quality={introQuality} />
              </Suspense>
            </div>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(171,196,255,0.2),transparent_52%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />

            <div className="absolute left-0 right-0 top-0 z-10 p-5 sm:p-7 flex items-center justify-between">
              <p className="text-[0.66rem] sm:text-xs uppercase tracking-[0.36em] text-zinc-300">AURA Cinematic Intro</p>
              <button
                type="button"
                onClick={dismissIntro}
                className="border border-white/30 bg-white/10 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.16em] text-white hover:bg-white/20 transition"
              >
                Skip Intro
              </button>
            </div>

            <div className="absolute bottom-10 left-1/2 z-10 w-[92%] max-w-4xl -translate-x-1/2 text-center text-white px-4">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.75 }}
                className="font-display text-5xl sm:text-7xl md:text-[6.6rem] leading-[0.88]"
              >
                AURA
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48, duration: 0.75 }}
                className="mt-4 text-sm sm:text-base md:text-lg text-zinc-200 tracking-[0.08em] uppercase"
              >
                Engineered motion. Editorial precision.
              </motion.p>

              <motion.button
                type="button"
                onClick={dismissIntro}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.6 }}
                className="mt-7 inline-flex items-center gap-2 border border-white/30 bg-white text-black px-7 py-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] hover:bg-zinc-200 transition"
              >
                Enter Experience <ArrowRight size={16} />
              </motion.button>

              <motion.div
                initial={{ scaleX: 0, opacity: 0.75 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 4.2, ease: 'linear' }}
                className="mx-auto mt-8 h-[2px] w-full max-w-md origin-left bg-white/60"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed left-0 right-0 top-16 z-40 h-[2px] bg-zinc-200/70">
        <motion.div
          className="h-full origin-left bg-gradient-to-r from-cyan-400 via-blue-500 to-zinc-900"
          style={{ scaleX: homeScrollScaleX }}
        />
      </div>

      <div
        ref={homeRef}
        className="relative h-screen overflow-y-auto overscroll-y-contain bg-white text-zinc-900 snap-y snap-mandatory"
      >
        <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundImage: ambientGradient }} />

        <div className="sticky top-28 z-30 ml-auto mr-4 hidden w-32 lg:block">
          <div className="rounded-sm border border-zinc-200/80 bg-white/70 px-3 py-4 backdrop-blur-sm">
            <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-zinc-500">Scroll Map</p>
            <div className="space-y-2">
              {scrollChapters.map((chapter) => {
                const isActive = chapter.id === activeSection

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => scrollToChapter(chapter.id)}
                    className="group flex w-full items-center gap-2 text-left"
                  >
                    <span
                      className={`h-[6px] w-[6px] rounded-full transition-all duration-300 ${
                        isActive ? 'bg-zinc-900 scale-125' : 'bg-zinc-400 group-hover:bg-zinc-600'
                      }`}
                    />
                    <span
                      className={`text-[11px] uppercase tracking-[0.14em] transition-colors ${
                        isActive ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-700'
                      }`}
                    >
                      {chapter.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 2D Hero After 3D Intro */}
        <section data-scroll-section="hero" className="relative h-[100svh] min-h-[760px] overflow-hidden bg-zinc-950 text-white snap-start">
          <motion.div
            className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl"
            animate={{ x: [0, 26, 0], y: [0, 16, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-blue-400/25 blur-3xl"
            animate={{ x: [0, -22, 0], y: [0, -18, 0], scale: [1.1, 1, 1.1] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(148,163,184,0.2),transparent_48%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(40deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:54px_54px] opacity-35" />

          <div className="relative z-10 h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-center">
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-5 text-xs tracking-[0.42em] uppercase text-zinc-300"
            >
              New season 2026
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.92, delay: 0.28 }}
              className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-[8.5rem] leading-[0.86] font-bold max-w-6xl"
            >
              AURA MOTION EDITION
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.46 }}
              className="mt-8 font-heading text-lg sm:text-xl md:text-2xl text-zinc-300 max-w-4xl leading-relaxed"
            >
              {heroCopy.title}
              {' '}
              {heroCopy.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                to="/products/featured"
                onClick={handleHeroClick}
                className="inline-flex items-center gap-2 bg-white text-zinc-900 text-sm sm:text-base py-3 px-8 hover:bg-zinc-100 transition"
              >
                {heroCopy.cta} <ArrowRight size={20} />
              </Link>

              <Link
                to="/products/new"
                className="inline-flex items-center gap-2 border border-white/40 px-8 py-3 text-sm sm:text-base hover:bg-white/10 transition"
              >
                See New Arrivals
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-zinc-300 text-xs uppercase tracking-[0.2em]"
            animate={{ y: [0, 8, 0], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            Scroll To Explore <ChevronDown size={16} />
          </motion.div>
        </section>

      {isAuthenticated && recommendedProducts.length > 0 && (
        <section data-scroll-section="feed" className="max-w-7xl mx-auto px-4 py-20 border-t border-zinc-200 snap-start">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Personalized</p>
              <h2 className="font-heading text-4xl font-bold">Recommended For You</h2>
            </div>
            <Link to="/products/featured" className="text-sm uppercase tracking-[0.1em] text-zinc-600 hover:text-zinc-900">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedProducts.map((product, idx) => (
              <motion.div key={`recommended-${product.id}-${idx}`} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {isAuthenticated && recentlyViewedProducts.length > 0 && (
        <section data-scroll-section="feed" className="max-w-7xl mx-auto px-4 py-20 border-t border-zinc-200 snap-start">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Continue Browsing</p>
              <h2 className="font-heading text-4xl font-bold">Recently Viewed</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyViewedProducts.map((product, idx) => (
              <motion.div key={`recent-${product.id}-${idx}`} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Runway Motion Strip */}
      <section data-scroll-section="feed" className="border-t border-zinc-200 py-10 overflow-hidden snap-start">
        <div className="mb-4 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Runway Motion Feed</p>
        </div>

        <motion.div
          className="flex gap-4 w-max px-4"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {[...runwayProducts, ...runwayProducts].map((item, idx) => {
            const imageCandidates = getProductImageCandidates(item)
            const initialImage = imageCandidates[0] || FALLBACK_IMAGE

            return (
              <motion.div
                key={`${item.id}-runway-${idx}`}
                whileHover={{ scale: 1.02, y: -2 }}
                className="w-[260px] shrink-0 border border-zinc-200 rounded-sm overflow-hidden bg-white cursor-pointer"
              >
                <Link to={`/product/${item.id}`} className="block">
                  <div className="h-[320px] bg-zinc-100 overflow-hidden">
                    <img
                      src={initialImage}
                      data-image-index="0"
                      alt={item.name}
                      onError={(e) => {
                        const currentIndex = Number(e.currentTarget.dataset.imageIndex || '0')
                        const nextImage = imageCandidates[currentIndex + 1]
                        if (nextImage) {
                          e.currentTarget.dataset.imageIndex = String(currentIndex + 1)
                          e.currentTarget.src = nextImage
                          return
                        }

                        e.currentTarget.onerror = null
                        e.currentTarget.src = FALLBACK_IMAGE
                      }}
                      className="h-full w-full object-cover hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-heading text-sm uppercase tracking-[0.22em] text-zinc-500 mb-2">AURA Edit</p>
                    <h3 className="font-heading text-lg font-bold truncate">{item.name}</h3>
                    <p className="text-zinc-600 mt-1">₹{item.price}</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* Tabbed Product Experience */}
      <section data-scroll-section="feed" className="max-w-7xl mx-auto px-4 py-24 border-t border-zinc-200 snap-start">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-5xl font-bold mb-3">Shop The Feed</h2>
          <p className="text-zinc-600 text-lg">Premium collections curated for modern style</p>
        </motion.div>

        <div className="flex justify-center flex-wrap gap-2 mb-10 bg-black p-3 rounded-md">
          {tabCategories.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-sm border text-sm uppercase tracking-[0.12em] transition ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white border-zinc-500 shadow-md'
                  : 'bg-black text-zinc-300 border-zinc-700 hover:border-zinc-400'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {tabbedProducts.length > 0 ? (
              tabbedProducts.map((product, idx) => (
                <motion.div
                  key={`${product.id}-tab-${idx}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-4 text-center py-12 text-zinc-500">
                No products found in this category
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Scroll Parallax Story */}
      <section data-scroll-section="story" ref={storyRef} className="relative border-t border-zinc-200 bg-zinc-50/40 snap-start">
        <div className="max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center min-h-[760px]">
          <motion.div style={{ y: storyPanelY }} className="lg:sticky lg:top-28 self-start">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-4">Product Story</p>
            <h2 className="font-heading text-5xl font-bold leading-tight mb-6">
              Motion-led product storytelling that feels alive on scroll
            </h2>
            <p className="text-zinc-600 text-lg leading-relaxed mb-7">
              Inspired by top fashion experiences, each block reacts to movement and keeps products in focus.
              This section stays immersive while the visual panel glides with parallax depth.
            </p>
            <Link
              to="/products/featured"
              className="inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-sm font-bold hover:bg-zinc-700 transition"
            >
              Discover More <ArrowRight size={18} />
            </Link>
          </motion.div>

          <motion.div style={{ y: storyImageY }} className="relative h-[620px] rounded-lg overflow-hidden border border-zinc-200 shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1100&h=1400&fit=crop"
              alt="Fashion parallax story"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = FALLBACK_IMAGE
              }}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute left-6 bottom-6 right-6 bg-white/90 backdrop-blur-sm p-5 border border-zinc-200">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 mb-2">Studio Note</p>
              <p className="font-heading text-xl font-bold text-zinc-900">Layered tailoring with modern proportions</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Editorial Motion Tiles */}
      <section data-scroll-section="editorial" className="max-w-7xl mx-auto px-4 py-20 border-t border-zinc-200 snap-start">
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="font-heading text-5xl font-bold mb-3">Editorial Edit</h2>
          <p className="text-zinc-600 text-lg">A motion-first showcase inspired by premium high-street fashion portals</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {editorialTiles.map((tile, idx) => (
            <motion.article
              key={tile.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: idx * 0.12 }}
              whileHover={{ y: -10 }}
              className="group relative h-[520px] overflow-hidden rounded-md border border-zinc-200 cursor-pointer"
            >
              <img
                src={tile.image}
                alt={tile.title}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = FALLBACK_IMAGE
                }}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <motion.div
                initial={{ opacity: 0.85 }}
                whileHover={{ opacity: 1 }}
                className="absolute left-0 right-0 bottom-0 p-7 text-white"
              >
                <p className="text-xs uppercase tracking-[0.3em] opacity-80 mb-3">AURA Studio</p>
                <h3 className="font-heading text-3xl font-bold mb-2">{tile.title}</h3>
                <p className="text-white/85 text-sm">{tile.subtitle}</p>
              </motion.div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section data-scroll-section="featured" className="max-w-7xl mx-auto px-4 py-24 border-t border-zinc-200 snap-start">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-5xl font-bold mb-4">Featured Collection</h2>
          <p className="text-zinc-600 text-lg">Runway-inspired essentials with fast-moving drops</p>
        </motion.div>

        {catalogNotice && (
          <div className="max-w-2xl mx-auto p-4 bg-zinc-100 border border-zinc-200 rounded-lg text-center mb-8">
            <p className="text-zinc-700 text-sm font-medium">{catalogNotice}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, idx) => (
              <ProductSkeleton key={idx} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {expandedProductFeed.map((product, idx) => (
                <motion.div
                  key={`${product.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <Link
                to="/products/featured"
                className="inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-sm font-bold hover:bg-zinc-700 transition"
              >
                View All Products <ArrowRight size={20} />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* 3D Product Lab */}
      <section data-scroll-section="lab" className="max-w-7xl mx-auto px-4 py-24 border-t border-zinc-200 snap-start">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75 }}
            className="space-y-6"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">3D Product Lab</p>
            <h2 className="font-heading text-5xl font-bold leading-tight">
              Rotate, inspect, and experience products before you buy
            </h2>
            <p className="text-zinc-600 text-lg leading-relaxed">
              We mix real catalog visuals with interactive 3D storytelling. Move through the object, examine material highlights,
              and preview silhouette behavior in motion.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              {['Dynamic light', '360 spin', 'Material detail'].map((label, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.12 }}
                  className="border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-center hover:border-zinc-900 transition"
                >
                  {label}
                </motion.div>
              ))}
            </div>

            <Link
              to="/products/featured"
              className="inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-sm font-bold hover:bg-zinc-700 transition"
            >
              Enter 3D Catalog <ArrowRight size={18} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75 }}
            className="relative h-[520px] rounded-lg border border-zinc-200 overflow-hidden bg-gradient-to-b from-zinc-100 to-zinc-200"
          >
            <motion.div
              className="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-white/55 blur-2xl"
              animate={{ x: [0, -12, 0], y: [0, 12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="pointer-events-none absolute -left-10 bottom-10 h-36 w-36 rounded-full bg-zinc-300/70 blur-2xl"
              animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />

            <Suspense fallback={<div className="h-full w-full bg-zinc-200" />}>
              <ProductViewer className="h-full w-full" />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section data-scroll-section="category" className="max-w-7xl mx-auto px-4 py-24 border-t border-zinc-200 snap-start">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-5xl font-bold mb-4">Shop by Category</h2>
          <p className="text-zinc-600 text-lg">Explore our diverse collections</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {categories.map((category, idx) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link
                to={category.link}
                className="block group overflow-hidden rounded-sm border border-zinc-300 hover:border-zinc-900 transition"
              >
                <div className="relative h-48 overflow-hidden bg-zinc-100">
                  <img
                    src={category.image}
                    alt={category.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = FALLBACK_IMAGE
                    }}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/45 transition" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <h3 className="font-heading text-2xl font-bold">{category.name}</h3>
                    <p className="text-sm mt-2 opacity-90">{category.count} items</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section data-scroll-section="cta" className="max-w-7xl mx-auto px-4 py-24 snap-start">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-zinc-100 border border-zinc-200 p-12 rounded-lg text-center"
        >
          <h2 className="font-heading text-4xl font-bold mb-4">Ready to Upgrade Your Style?</h2>
          <p className="text-zinc-600 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of fashion enthusiasts who trust AURA for premium quality and innovative design.
          </p>
          <Link
            to="/products/featured"
            className="inline-flex items-center gap-2 bg-zinc-900 text-white py-3 px-8 rounded-sm hover:bg-zinc-700 transition"
          >
            Shop Now <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>
      </div>
    </>
  )
}
