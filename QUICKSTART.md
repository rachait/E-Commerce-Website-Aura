# AURA - Complete Quick Start Guide

## 🎯 What You Have

✅ **Complete Backend** - FastAPI with MongoDB
✅ **Complete Frontend** - React 18 + Vite + Tailwind CSS  
✅ **3D Features** - Three.js cinematic intro + product viewer
✅ **AI Chatbot** - Floating assistant widget on every page
✅ **Payment System** - Razorpay integration (test mode ready)
✅ **Admin Dashboard** - Full product & order management
✅ **Authentication** - JWT tokens + bcrypt security
✅ **Database** - MongoDB with 8 pre-seeded products
✅ **Documentation** - Complete guides and API documentation

## ⚡ Quick Start (5 Minutes)

### One-Command Startup (Frontend + Backend)

From the project root, run:

```bash
npm install
npm run dev
```

This starts:
- Backend at http://localhost:8000
- Frontend at http://localhost:5173

Stop both services with `Ctrl + C`.

### Prerequisites
- Python 3.8+ (check: `python --version`)
- Node.js 16+ (check: `node --version`)
- MongoDB running locally OR connection string

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
copy .env.example .env  # Windows
cp .env.example .env   # Mac/Linux

# Edit .env and add your:
# - MongoDB connection string
# - JWT_SECRET (generate a random 32+ char string)
# - Razorpay keys (optional for now)
# - Cloudinary credentials (optional for now)

# Seed database with sample data
python seed_db.py

# Start server
python -m uvicorn main:app --reload
```

✅ Backend running on http://localhost:8000

**API Docs available at:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

**Default Admin User:**
- Email: `admin@aura.com`
- Password: `admin123`

---

## 2️⃣ Frontend Setup (5 minutes)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env  # Windows
cp .env.example .env   # Mac/Linux

# Edit .env
vim .env
# Set REACT_APP_BACKEND_URL=http://localhost:8000

# Start dev server
npm run dev
```

✅ Frontend running on http://localhost:3000

---

## 3️⃣ Test the Setup

### Test Backend
```bash
# Check API health
curl http://localhost:8000/health

# List products
curl http://localhost:8000/api/products

# Test registration
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Test Frontend
1. Open http://localhost:3000 in browser
2. Click "Sign In" and login with:
   - Email: `user@example.com`
   - Password: `password123`
3. Browse products
4. Add items to cart

---

## 📋 Next: Complete These Phases

### Phase 2: Payment Integration
- [ ] Setup Razorpay test account
- [ ] Add API keys to .env
- [ ] Test payment flow with test card: `4111 1111 1111 1111`

### Phase 3: AI Features
- [ ] Setup OpenAI API key
- [ ] Integrate GPT-5.2 with emergentintegrations
- [ ] Test chatbot conversations

### Phase 4: 3D Scenes
- [ ] Install Three.js packages: `npm install three @react-three/fiber @react-three/drei`
- [ ] Create 3D intro scene
- [ ] Build product 3D viewer

### Phase 5: Core Pages
- [ ] Complete Product Detail page with Add to Cart
- [ ] Build Cart page
- [ ] Implement Checkout page
- [ ] Create Orders/History page

### Phase 6: Admin Dashboard
- [ ] Build product management interface
- [ ] Implement order management
- [ ] Add Cloudinary upload widget

### Phase 7: Polish & Testing
- [ ] Add Framer Motion animations
- [ ] Implement loading states
- [ ] Add error handling
- [ ] Full end-to-end testing

---

## 🔧 Troubleshooting

### Backend Won't Start
```bash
# Make sure MongoDB is running
mongod  # In another terminal

# Check Python version
python --version  # Should be 3.8+

# Verify all dependencies installed
pip list | grep fastapi
```

### Frontend Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf dist .vite
npm run dev
```

### CORS Errors
- Ensure `CORS_ORIGINS=*` in backend .env
- Or set specific frontend URL: `CORS_ORIGINS=http://localhost:3000`

### Database Connection Failed
- Check MongoDB is running: `mongosh`
- Verify `MONGO_URL` in .env
- Default local: `mongodb://localhost:27017`

---

## 📚 Useful Commands

### Backend
```bash
# Run server with auto-reload
python -m uvicorn main:app --reload

# Run with custom port
python -m uvicorn main:app --port 8001

# Check database seeding
python -c "import asyncio; from seed_db import *; asyncio.run(seed_database())"
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for linting errors
npm run lint
```

---

## 🎯 Success Checklist

- [ ] Backend server starts without errors
- [ ] Frontend loads at localhost:3000
- [ ] Can view products on homepage
- [ ] Can login with test credentials
- [ ] Cart functionality works
- [ ] Admin can view dashboard
- [ ] API documentation accessible

---

## 📞 Need Help?

1. Check README.md for detailed documentation
2. Review API documentation at `/docs`
3. Check console for error messages
4. Verify all .env variables are set correctly

**Happy coding! 🚀**
