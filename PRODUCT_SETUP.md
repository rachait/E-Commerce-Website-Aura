# Product Setup & Database Seeding Guide

## Overview
Your ecommerce platform now includes a comprehensive product catalog with **25+ products** across **5 categories**, each with multiple high-quality images.

## Product Categories

### 1. **Fashion** (8 products)
- Women's: Jacket, Dress, Cami Top, Evening Gown, White Linen Shirt
- Men's: Minimalist Shirt, Trousers, Cargo Vest, Leather Jacket, Oxford Shirt

### 2. **Footwear** (3 products)
- Luxury White Sneakers
- Elegant Black Heels
- Casual Brown Loafers

### 3. **Accessories** (4 products)
- Silk Sleep Mask
- Premium Leather Belt
- Gold Statement Necklace
- Designer Sunglasses

### 4. **Bags** (3 products)
- Luxury Leather Tote Bag
- Crossbody Shoulder Bag
- Classic Black Backpack

### 5. **Makeup & Beauty** (4 products)
- Luxury Lipstick Set
- Premium Eye Shadow Palette
- Hydrating Face Serum
- Luxe Face Cream

---

## How to Seed the Database

### Prerequisites
- MongoDB running on `localhost:27017` (or update `MONGO_URL` in `config.py`)
- Python environment with dependencies installed

### Step 1: Ensure MongoDB is Running
```bash
# On Windows with MongoDB installed locally
mongod

# Or start MongoDB service
net start MongoDB
```

### Step 2: Run the Seed Script
Navigate to the backend directory and execute:

```bash
cd backend
python seed_db.py
```

### Expected Output
```
🌱 Starting database seeding...
✅ Inserted 25 products
✅ Created indexes
✅ Admin user created: admin@aura.com / admin123
✅ Sample user already exists
🌟 Database seeding complete!

Test Credentials:
  Admin: admin@aura.com / admin123
  User:  user@example.com / password123
```

---

## Test Credentials After Seeding

### Admin Account
- **Email:** `admin@aura.com`
- **Password:** `admin123`
- **Role:** Admin (can manage products, orders, etc.)

### Sample User Account
- **Email:** `user@example.com`
- **Password:** `password123`
- **Role:** User (can browse and purchase)

---

## Product Image Sources

All product images are sourced from **Unsplash** (free, high-quality stock photos):
- Fashion images: Professional clothing photography
- Footwear: Designer shoe collections
- Accessories: Jewelry and fashion items
- Bags: Leather goods and travel bags
- Makeup: Beauty and cosmetics

**Note:** Images are loaded with `w=500&h=700&fit=crop` for consistent sizing.

---

## Database Schema

Each product includes:

```javascript
{
  name: String,                    // Product name
  description: String,             // Product description
  price: Number,                   // Current price (₹)
  originalPrice: Number,           // Original price (for discounts)
  category: String,                // fashion, footwear, accessories, bags, makeup
  subcategory: String,             // women, men, unisex, beauty
  sizes: Array,                    // Available sizes
  images: Array,                   // Multiple product images (URLs)
  stock: Number,                   // Available quantity
  rating: Number,                  // Product rating (0-5)
  reviews: Number,                 // Number of reviews
  featured: Boolean,               // Featured product flag
  sku: String,                     // Stock keeping unit
  createdAt: DateTime              // Creation timestamp
}
```

---

## Features Enabled with Products

### ✅ Frontend Features
- Browse products by category
- View product details with multiple images
- Quick add to cart from product grid
- Size selection and quantity controls
- Price comparison (original vs. current)
- Stock status indicators
- Product ratings and reviews
- Sorting and filtering options

### ✅ Admin Features
- View all products in dashboard
- Add new products with images
- Edit product details
- Delete products
- Track inventory levels
- Monitor low stock items

---

## Customization

### To Add More Products
Edit `seed_db.py` and add new product objects to the `sample_products` list:

```python
{
    "name": "Your Product Name",
    "description": "Product description",
    "price": 5999,
    "originalPrice": 7999,
    "category": "fashion",  # or footwear, accessories, bags, makeup
    "subcategory": "women", # or men, unisex, beauty
    "sizes": ["XS", "S", "M", "L", "XL"],
    "images": [
        "https://images.unsplash.com/photo-xxxxx?w=500&h=700&fit=crop",
        "https://images.unsplash.com/photo-yyyyy?w=500&h=700&fit=crop"
    ],
    "stock": 50,
    "rating": 4.8,
    "reviews": 234,
    "featured": True,
    "sku": "CAT-PRD-001",
    "createdAt": datetime.utcnow()
}
```

Then run the seed script again.

### To Use Custom Images
Replace Unsplash URLs with your own image URLs or upload to Cloudinary:
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Upload your product images
3. Copy the image URLs and update the `images` array

---

## Troubleshooting

### MongoDB Connection Error
**Error:** "Cannot connect to MongoDB"
- Ensure MongoDB is running: `mongod`
- Check MongoDB URL in `backend/config.py`
- Default: `mongodb://localhost:27017`

### Database Already Has Products
The seed script won't duplicate products. If you want to reset:

1. Uncomment this line in `seed_db.py`:
```python
await db.products.delete_many({})
```

2. Run the script again

### Images Not Loading
- Check internet connection (images are from Unsplash)
- Verify image URLs are correctly formatted
- Use direct image URLs without redirect parameters

---

## Next Steps

1. **Run the seed script:** `python seed_db.py`
2. **Start the backend:** `cd backend && uvicorn main:app --reload`
3. **Start the frontend:** `cd frontend && npm run dev`
4. **Visit:** `http://localhost:5173`
5. **Browse products** with all images and features enabled!

---

## Performance Tips

- Images are optimized with `w=500&h=700` parameters
- Lazy loading is enabled for product cards
- Multiple images per product for better UX
- Featured products are highlighted on homepage

---

For more help, check:
- Backend: `backend/main.py` for API endpoints
- Frontend: `frontend/src/pages/Products.jsx` for product display
- Admin: `http://localhost:5173/admin` to manage products

Happy selling! 🎉
