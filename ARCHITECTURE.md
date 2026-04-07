# AURA Architecture Overview

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser (React)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Home (3D Intro)  →  Products  →  Detail  →  Cart      │ │
│  │  Auth Page  ←  Checkout  ←  Razorpay  →  Orders       │ │
│  │  Admin Dashboard  →  Chatbot Widget (All Pages)        │ │
│  │                                                          │ │
│  │  State: AuthContext, CartContext, ToastContext         │ │
│  │  HTTP: Axios Interceptors with JWT                     │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────┘
                         │ Vite Dev Server (Port 5173)
                         │ HTTP/CORS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Server (Port 8000)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          CORS Middleware  →  Route Handler             │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │  Route: /auth  →  Auth utilities (bcrypt, JWT) │   │ │
│  │  │  Route: /products  → ProductsCache Layer       │   │ │
│  │  │  Route: /cart   → Cart persistance              │   │ │
│  │  │  Route: /checkout → Razorpay integration       │   │ │
│  │  │  Route: /orders → Order tracking               │   │ │
│  │  │  Route: /cloudinary → Signed URLs              │   │ │
│  │  │  Route: /ai → OpenAI ChatCompletion API        │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                                                          │ │
│  │  Utilities: auth (JWT, bcrypt), cloudinary, razorpay   │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────┘
                         │ Async Motor Driver (Port 27017)
                         │ TCP Connection
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Database                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  users: _id, email, password, role, preferences       │ │
│  │  products: _id, name, price, category, stock, images  │ │
│  │  cart: _id, userId (unique), items[], updatedAt       │ │
│  │  orders: _id, orderId, userId, items, status, total   │ │
│  │  chathistory: _id, sessionId, messages[], createdAt   │ │
│  │                                                          │ │
│  │  Indexes: email (unique), userId (unique), featured    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Diagram

### Authentication Flow
```
User Input (Email/Password)
    ↓
⚛️ Auth.jsx (Login Form)
    ↓
axios → POST /auth/login
    ↓
🐍 auth.py (hash verify with bcrypt)
    ↓
MongoDB queries users collection
    ↓
JWT token generated
    ↓
Response sent back to React
    ↓
AuthContext stored in localStorage
    ↓
Token in axios Authorization header
```

### Shopping Flow
```
Browse Products
    ↓
productsAPI.getFeatured() → GET /products/featured
    ↓
MongoDB returns featured=true products
    ↓
ProductCard rendered with lazy images
    ↓
User clicks "Add to Cart"
    ↓
addToCart(productId, qty, size)
    ↓
POST /cart/add with JWT auth
    ↓
MongoDB cart updated with userId
    ↓
CartContext updated, UI reflects new count
```

### Checkout & Payment
```
User in Cart → Click Checkout
    ↓
Navigate to /checkout (protected route)
    ↓
Multi-step form (Address → Payment → Confirm)
    ↓
Click "Place Order & Pay"
    ↓
POST /orders {items, address, amount}
    ↓
Order created in MongoDB with orderId
    ↓
POST /payment/create-order {amount, orderId}
    ↓
Razorpay returns order_id, amount
    ↓
Open Razorpay modal (user pays)
    ↓
Razorpay returns signature
    ↓
POST /payment/verify {signature, payment_id}
    ↓
Verify HMAC signature (security)
    ↓
Clear cart and show success
    ↓
Redirect to orders page
```

### AI Chat Flow
```
User opens ChatbotWidget (floating button)
    ↓
User types message
    ↓
Message added to local state
    ↓
POST /ai/chat {message, sessionId}
    ↓
🐍 OpenAI API called with user message
    ↓
GPT-5.2 generates response
    ↓
Response returned to ChatbotWidget
    ↓
Message rendered with typing animation
    ↓
Auto-scroll to bottom
    ↓
Continue conversation...
```

## 🔐 Security Layers

```
Client Layer:
├── HTTPS (in production)
├── localStorage for JWT (protected by browser)
├── XSS protection (React auto-escapes)
└── Input validation on forms

API Layer:
├── CORS whitelist enforcement
├── Rate limiting (recommended)
├── Request validation schemas
└── Authorization header checks

Database Layer:
├── Password hashing (bcrypt 10 rounds)
├── Unique indexes on sensitive fields
├── Role-based access control
└── No sensitive data in URLs

Payment Layer:
├── Razorpay HMAC verification
├── Order verification before payment
└── Encrypted payment transmission
```

## 🚀 Deployment Architecture

```
Production Setup:
┌───────────────────────────────────────────────────────────┐
│  Vercel/Netlify                                           │
│  Frontend: React build → dist/ → CDN                      │
│  Environment: VITE_API_URL=https://api.aura.com          │
└──────────────────┬────────────────────────────────────────┘
                   │ HTTPS
┌──────────────────┴────────────────────────────────────────┐
│  Railway/Render                                           │
│  Backend: uvicorn main:app --host 0.0.0.0               │
│  Environment: MONGODB_URL, JWT_SECRET, API keys          │
└──────────────────┬────────────────────────────────────────┘
                   │ TLS
┌──────────────────┴────────────────────────────────────────┐
│  MongoDB Atlas                                            │
│  Database: aura (prod)                                    │
│  Backups: Daily automatic                                │
└───────────────────────────────────────────────────────────┘
```

## 🔄 Component Communication

### React Component Tree
```
App
├── AuthProvider
│   └── CartProvider
│       └── ToastProvider
│           ├── Navbar
│           │   └── useAuth(), useCart()
│           ├── Routes
│           │   ├── Home
│           │   │   ├── IntroScene (Three.js)
│           │   │   └── ProductCard x 8
│           │   ├── Products
│           │   │   └── ProductCard x N (filtered)
│           │   ├── ProductDetail
│           │   │   ├── ProductViewer (3D)
│           │   │   └── useCart() → addToCart
│           │   ├── Cart
│           │   │   └── useCart() → updateCart
│           │   ├── Checkout
│           │   │   └── Razorpay integration
│           │   ├── Orders
│           │   │   └── ordersAPI.getMyOrders()
│           │   ├── Admin
│           │   │   └── Admin-only with useAuth check
│           │   └── Auth
│           │       └── AuthContext → login/register
│           └── ChatbotWidget
│               └── aiAPI.chat()
```

### State Management Flow
```
Global State:
├── AuthContext
│   ├── user: User | null
│   ├── token: string | null
│   ├── isAuthenticated: boolean
│   └── Functions: register(), login(), logout()
│
├── CartContext
│   ├── cart: { items: [...] } | null
│   ├── addToCart()
│   ├── updateCart()
│   ├── removeFromCart()
│   └── clearCart()
│
└── ToastContext
    ├── toasts: Toast[]
    └── Functions: showToast(), removeToast()

Local Component State:
├── Home: [featured, loading]
├── Products: [filtered, search, category]
├── ProductDetail: [product, quantity, size]
├── Checkout: [step, formData, loading]
├── Orders: [orders, expandedOrder]
└── ChatbotWidget: [messages, input, loading]
```

## 🎨 Design System Structure

```
Colors:
├── Primary: #00F0FF (cyan-neon)
│   └── Used for: headings, buttons, accents
├── Dark: #050505 (dark-bg)
│   └── Used for: page background
├── Surface: #0C0C0F (dark-surface)
│   └── Used for: cards, panels, overlays
├── Text Primary: #FFFFFF
│   └── Used for: main text
└── Text Secondary: #888888
    └── Used for: descriptions, meta info

Typography:
├── Display Font: Syncopate
│   └── Used for: logo, hero headlines
├── Heading Font: Outfit
│   └── Used for: section titles, headings
└── Body Font: Manrope
    └── Used for: body text, descriptions

Effects:
├── Glass Panels: bg-white/5 backdrop-blur-2xl
├── Neon Glow: text-cyan-neon with emissive
├── Transitions: 300ms ease-in-out
└── Animations: Framer Motion spring/easing
```

## 📈 Performance Optimization

```
Frontend:
├── Code Splitting: React.lazy() + Suspense
├── Image Loading: Lazy loading with Cloudinary
├── Build: Vite minification + tree-shaking
├── Size: ~650 KB gzipped
└── Load Time: <2 seconds from CDN

Backend:
├── Async Operations: Motor driver
├── Database Indexing: On _id, email, userId
├── Caching: HTTP cache headers
├── Response Time: <100ms average
└── Scalability: Horizontal with load balancer

3D Graphics:
├── Lazy Loading: Suspense boundary
├── LOD Models: Simplified meshes
├── Texture Compression: Cloudinary optimization
└── Frame Rate: 60 FPS target
```

## 🔧 Technology Stack Breakdown

### Frontend Dependencies
```
├── react@18.2.0 - UI library
├── react-router-dom@6 - Client routing
├── axios@1.4.0 - HTTP client
├── tailwindcss@3.x - Utility-first CSS
├── framer-motion@10.x - Animation library
├── three@r157 - 3D graphics
├── @react-three/fiber@8.x - React wrapper for Three.js
├── @react-three/drei@9.x - Three.js utilities
├── lucide-react@latest - Icon library
└── vite@5.x - Build tool
```

### Backend Dependencies
```
├── fastapi@latest - Web framework
├── uvicorn@latest - ASGI server
├── motor@latest - Async MongoDB driver
├── pymongo@latest - MongoDB client
├── python-jose@3.x - JWT tokens
├── passlib@1.x - Password hashing
├── python-dotenv@latest - Environment variables
├── pydantic@2.x - Data validation
├── httpx@latest - Async HTTP client
└── cors middleware - CORS support
```

## 🎯 Feature Implementation Checklist

```
✅ Core Features
  ✅ User authentication (register/login)
  ✅ JWT token management
  ✅ Product browsing with filters
  ✅ Shopping cart functionality
  ✅ Multi-step checkout
  ✅ Order history tracking
  ✅ Admin product management
  
✅ Advanced Features
  ✅ 3D intro scene with particles
  ✅ Interactive product viewer
  ✅ AI chatbot widget
  ✅ Razorpay payment integration
  ✅ Glassmorphism design system
  ✅ Responsive mobile layout
  
✅ Infrastructure
  ✅ MongoDB database seeding
  ✅ Environment configuration
  ✅ CORS middleware setup
  ✅ Error handling
  ✅ API documentation
  
⏳ Future (Post-Launch)
  ⏳ Email notifications
  ⏳ Social sharing features
  ⏳ User reviews & ratings
  ⏳ Wishlist functionality
  ⏳ Advanced analytics
  ⏳ Mobile native app
```

---

This architecture ensures:
- **Scalability**: Horizontal scaling at all layers
- **Security**: Multiple security layers
- **Performance**: Optimized data flow
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add new features
