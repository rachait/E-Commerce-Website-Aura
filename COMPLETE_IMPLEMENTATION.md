# AURA - Complete Feature Implementation Guide

## Project Overview

AURA is a cutting-edge 3D eCommerce platform built with MERN stack (MongoDB, Express-like FastAPI, React, Node.js) featuring premium design, real-time 3D visualization, AI-powered shopping assistance, and secure payment processing.

## Tech Stack

### Backend
- **Framework**: FastAPI with Motor (async MongoDB driver)
- **Database**: MongoDB with auto-indexing
- **Authentication**: JWT + bcrypt password hashing
- **Third-party APIs**: Razorpay, Cloudinary, OpenAI GPT-5.2
- **Server**: Uvicorn ASGI server

### Frontend
- **Library**: React 18.2.0 with Vite 5.0+
- **Styling**: Tailwind CSS with custom glassmorphism design
- **3D Graphics**: Three.js + React Three Fiber
- **Animations**: Framer Motion
- **State Management**: React Context
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React

## Project Structure

### Backend (`backend/`)
```
backend/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration and environment variables
├── database.py            # MongoDB connection and initialization
├── seed_db.py             # Database seeding script
├── requirements.txt       # Python dependencies
└── app/
    ├── models.py          # Pydantic schemas for request/response
    ├── schemas.py         # Data validation schemas
    ├── utils/
    │   ├── auth.py        # JWT and bcrypt utilities
    │   ├── cloudinary_helper.py
    │   └── razorpay_helper.py
    └── routes/
        ├── auth.py        # User registration, login, profile
        ├── products.py    # Product CRUD and listing
        ├── cart.py        # Cart management
        ├── orders.py      # Order creation and tracking
        ├── payment.py     # Razorpay integration
        ├── cloudinary.py  # Image upload signatures
        └── ai.py          # AI chat, recommendations, style advisor
```

### Frontend (`frontend/`)
```
frontend/
├── src/
│   ├── App.jsx            # Main app with routing
│   ├── main.jsx           # Entry point
│   ├── index.html         # HTML template
│   ├── pages/
│   │   ├── Home.jsx       # Landing page with 3D intro
│   │   ├── Products.jsx   # Product listing with filters
│   │   ├── ProductDetail.jsx
│   │   ├── Cart.jsx       # Shopping cart
│   │   ├── Checkout.jsx   # Multi-step checkout with Razorpay
│   │   ├── Orders.jsx     # Order history and tracking
│   │   ├── Auth.jsx       # Login/register pages
│   │   └── Admin.jsx      # Admin dashboard
│   ├── components/
│   │   ├── Navbar.jsx     # Navigation header
│   │   ├── ProductCard.jsx
│   │   ├── ChatbotWidget.jsx  # Floating AI assistant
│   │   ├── Skeleton.jsx   # Loading skeletons
│   ├── context/
│   │   ├── AuthContext.jsx    # Auth state management
│   │   ├── CartContext.jsx    # Cart state management
│   │   └── ToastContext.jsx   # Toast notifications
│   ├── 3d/
│   │   ├── IntroScene.jsx     # Cinematic intro animation
│   │   └── ProductViewer.jsx  # Interactive 3D product viewer
│   ├── utils/
│   │   └── api.js         # Centralized API calls
│   └── styles/
│       └── globals.css    # Global styles
├── vite.config.js
├── tailwind.config.cjs    # Tailwind configuration (CommonJS for ES modules)
├── postcss.config.cjs     # PostCSS configuration
└── package.json
```

## Core Features Implemented

### 1. Authentication System
- **Registration**: Email/password with validation
- **Login**: JWT token generation
- **Session Management**: LocalStorage persistence
- **Admin Role**: Special privileges for dashboard access
- **Password Security**: bcrypt hashing with salt rounds

**Routes:**
- POST `/auth/register` - Create new user
- POST `/auth/login` - Get JWT token
- GET `/auth/me` - Get current user profile

### 2. Product Management
- **Listing**: Category filtering, search functionality
- **Details**: Images, sizes, pricing, stock status
- **Admin Functions**: Create, update, delete products
- **Featured Products**: Auto-fetch on home page

**Routes:**
- GET `/products` - List with filters
- GET `/products/featured` - Get featured items
- GET `/products/{id}` - Product details
- POST `/products` (admin) - Create product
- PUT `/products/{id}` (admin) - Update product
- DELETE `/products/{id}` (admin) - Delete product

### 3. Shopping Cart
- **Add/Remove Items**: Real-time cart updates
- **Quantity Management**: +/- buttons with validation
- **Persistent Storage**: Cart saved to MongoDB
- **Price Calculation**: Automatic subtotal computation

**Routes:**
- GET `/cart` - Get current cart
- POST `/cart/add` - Add item
- PUT `/cart/update` - Update quantity
- DELETE `/cart/{itemId}` - Remove item
- DELETE `/cart` - Clear cart

### 4. Checkout Flow
- **Multi-step Wizard**: Address → Payment → Confirm
- **Form Validation**: All required fields enforced
- **Tax Calculation**: 18% GST added to subtotal
- **Razorpay Integration**: Secure payment processing
- **Order Creation**: Saved to database with full details

**Routes:**
- POST `/orders` - Create order
- GET `/orders` - Get user orders
- POST `/payment/create-order` - Create Razorpay order
- POST `/payment/verify` - Verify payment signature

### 5. Order Management
- **Order History**: View all user purchases
- **Status Tracking**: Pending → Processing → Completed
- **Order Details**: Itemized invoice with shipping
- **Admin View**: All orders with status management

**Routes:**
- GET `/orders` - User orders
- GET `/orders/{id}` - Order details
- PUT `/orders/{id}` (admin) - Update status

### 6. 3D Visualization
- **Intro Scene**: Animated geometric shapes with particles
  - Spinning cube with cyan neon glow
  - Floating particle system
  - Rotating rings with magenta color
  - Auto-rotating camera with OrbitControls

- **Product Viewer**: Interactive 3D model visualization
  - Generic product shape with metallic materials
  - Manual rotation and zoom controls
  - Camera positioning with OrbitControls
  - Grid background for reference

### 7. AI Chatbot Widget
- **Floating Interface**: Fixed position chat bubble
- **Conversation History**: Multi-turn conversations
- **Auto-scroll**: Messages scroll to bottom
- **Loading States**: Animated typing indicator
- **Fallback Handling**: Graceful error messages
- **Session Management**: Per-session chat history

Features:
- Ask product recommendations
- Style advisor assistance
- Order tracking queries
- General fashion advice

### 8. Admin Dashboard
- **Statistics**: Total products, orders, revenue, users
- **Product Management**: Add, edit, delete products with forms
- **Order Management**: View and update order status
- **Tabbed Interface**: Switch between dashboard/products/orders
- **Role-based Access**: Admin-only pages with auth checks

### 9. Design System (Glassmorphism)
- **Color Scheme**:
  - Primary: Neon Cyan #00F0FF
  - Secondary: Magenta #FF00FF
  - Background: Dark Black #050505
  - Surface: #0C0C0F
  - Text Primary: White
  - Text Secondary: Gray #888888

- **Typography**:
  - Display: Syncopate (bold headlines)
  - Heading: Outfit (section titles)
  - Body: Manrope (regular text)

- **Visual Effects**:
  - Glass panels: `bg-white/5 backdrop-blur-2xl border border-white/10`
  - Neon glow: Cyan cyan-neon text with emissive effects
  - Smooth transitions: 300ms ease-in-out
  - Animations: Framer Motion for smooth UX

### 10. Payment Integration
- **Razorpay**: PCI-compliant payment gateway
- **Order Creation**: Generate unique order ID
- **Payment Verification**: HMAC signature validation
- **Success Handling**: Clear cart after payment
- **Error Recovery**: Retry mechanism for failed payments

## API Endpoints Summary

### Authentication
```
POST   /auth/register           # Register new user
POST   /auth/login              # Login user
GET    /auth/me                 # Get current user
```

### Products
```
GET    /products                # List all products
GET    /products/featured       # Get featured products
GET    /products/{id}           # Get product detail
POST   /products                # Create (admin only)
PUT    /products/{id}           # Update (admin only)
DELETE /products/{id}           # Delete (admin only)
```

### Cart
```
GET    /cart                    # Get cart
POST   /cart/add                # Add to cart
PUT    /cart/update             # Update quantity
DELETE /cart/{itemId}           # Remove from cart
DELETE /cart                    # Clear cart
```

### Orders
```
POST   /orders                  # Create order
GET    /orders                  # Get user orders
GET    /orders/{id}             # Get order details
PUT    /orders/{id}             # Update status (admin)
```

### Payment
```
POST   /payment/create-order    # Create Razorpay order
POST   /payment/verify          # Verify payment
```

### AI
```
POST   /ai/chat                 # Chat with AI
GET    /ai/recommendations      # Get recommendations
GET    /ai/style-advisor        # Get style advice
```

### Cloudinary
```
POST   /cloudinary/signature    # Get upload signature
```

## Database Models

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String, // 'user' or 'admin'
  preferences: {
    favoriteCategories: [String],
    size: String,
    style: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Products Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  category: String,
  sizes: [String],
  images: [String], // Cloudinary URLs
  model3dUrl: String,
  stock: Number,
  featured: Boolean,
  ratings: {
    average: Number,
    count: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Cart Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (unique),
  items: [
    {
      productId: ObjectId,
      quantity: Number,
      size: String,
      price: Number,
      addedAt: Date
    }
  ],
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  orderId: String (unique),
  userId: ObjectId,
  items: [
    {
      productId: ObjectId,
      quantity: Number,
      size: String,
      price: Number
    }
  ],
  totalAmount: Number,
  paymentStatus: String, // 'pending', 'processing', 'completed'
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  status: String, // 'pending', 'processing', 'shipped', 'delivered'
  createdAt: Date,
  updatedAt: Date
}
```

### ChatHistory Collection
```javascript
{
  _id: ObjectId,
  sessionId: String (unique),
  userId: ObjectId,
  messages: [
    {
      role: String, // 'user' or 'assistant'
      content: String,
      timestamp: Date
    }
  ],
  createdAt: Date
}
```

## Environment Variables

### Backend (.env)
```
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/aura
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION_HOURS=24
BCRYPT_ROUNDS=10

RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

OPENAI_API_KEY=your-openai-api-key

CORS_ORIGINS=http://localhost:5173,http://localhost:3000

ADMIN_EMAIL=admin@aura.com
ADMIN_PASSWORD=AdminPassword123!
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=your-razorpay-public-key
```

## Installation & Setup

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_db.py  # Seed sample data
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Key Implementation Highlights

### 1. Real-time State Management
- **Context API** for global auth and cart state
- Auto-fetch user on app load
- Auto-persist cart to backend
- Automatic token injection in requests

### 2. Secure Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens in Authorization headers
- Auto-logout on token expiration
- Protected routes with role checking

### 3. Performance Optimization
- Lazy loading for 3D components
- Debounced search in products
- Image lazy loading with Cloudinary
- Suspense boundaries for code splitting

### 4. Error Handling
- Try-catch blocks for all API calls
- User-friendly error messages
- Toast notifications for feedback
- Fallback UI for failed states

### 5. Responsive Design
- Mobile-first approach with Tailwind
- Responsive grid layouts
- Touch-friendly UI elements
- Optimized for all screen sizes

## Testing Credentials

**Admin Account:**
- Email: `admin@aura.com`
- Password: `AdminPassword123!`

**Demo User Account:**
- Email: `user@aura.com`
- Password: `UserPassword123!`

## Deployment

### Backend (Vercel/Railway/Render)
```bash
# Build
pip install -r requirements.txt

# Environment variables required
# Run: uvicorn main:app
```

### Frontend (Vercel/Netlify)
```bash
# Build
npm run build

# Output: dist/
# Deploy dist folder
```

## Troubleshooting

**CORS Errors**: Ensure backend CORS_ORIGINS includes frontend URL
**JWT Errors**: Verify JWT_SECRET is same in .env and auth routes
**3D Not Loading**: Check Three.js and React Three Fiber versions
**Payment Failures**: Verify Razorpay credentials and network enabled

## Future Enhancements

1. **Advanced 3D Models**: Load custom GLTF/GLB models for products
2. **AR Try-on**: Virtual fitting room for clothes
3. **Social Features**: User reviews, ratings, sharing
4. **Wishlist**: Save favorite items
5. **Email Notifications**: Order confirmations, promotions
6. **Analytics**: User behavior tracking, sales dashboard
7. **Inventory Management**: Real-time stock updates
8. **Multi-currency**: Support international customers
9. **Mobile App**: React Native version
10. **AI Personalization**: ML-based recommendations

## Support

For issues or questions, contact: support@aura.com

---

**AURA - Elevating Fashion Through Technology**
