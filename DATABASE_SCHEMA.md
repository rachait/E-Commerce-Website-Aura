# AURA Database Schema

## MongoDB Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String, // 'user' | 'admin'
  preferences: {
    style: [String],
    favoriteCategories: [String]
  },
  createdAt: Date
}
```

**Indexes:**
- `email` (unique)

### Products Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  category: String, // 'men' | 'women' | 'new-collection' | 'featured'
  sizes: [String],
  images: [String], // Cloudinary URLs
  model3dUrl: String, // Optional 3D model URL
  stock: Number,
  featured: Boolean,
  createdAt: Date
}
```

**Indexes:**
- `category`

### Cart Collection
```javascript
{
  _id: ObjectId,
  userId: String (unique),
  items: [
    {
      productId: String,
      quantity: Number,
      size: String,
      price: Number
    }
  ],
  updatedAt: Date
}
```

**Indexes:**
- `userId` (unique)

### Orders Collection
```javascript
{
  _id: ObjectId,
  orderId: String (unique),
  userId: String,
  items: [
    {
      productId: String,
      name: String,
      quantity: Number,
      size: String,
      price: Number,
      image: String
    }
  ],
  totalAmount: Number,
  paymentStatus: String, // 'pending' | 'completed' | 'failed'
  razorpayOrderId: String,
  razorpayPaymentId: String,
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  status: String, // 'processing' | 'shipped' | 'delivered'
  createdAt: Date
}
```

**Indexes:**
- `userId`

### Chat History Collection
```javascript
{
  _id: ObjectId,
  sessionId: String (unique),
  userId: String, // Optional for guest sessions
  messages: [
    {
      role: String, // 'user' | 'assistant'
      content: String,
      timestamp: Date
    }
  ],
  createdAt: Date
}
```

**Indexes:**
- `sessionId` (unique)

## MongoDB Setup

### Connection String
```
mongodb://localhost:27017/aura_ecommerce
```

### Creating Indexes (if not auto-created)
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.products.createIndex({ category: 1 })
db.orders.createIndex({ userId: 1 })
db.cart.createIndex({ userId: 1 }, { unique: true })
db.chat_history.createIndex({ sessionId: 1 }, { unique: true })
```

## Seed Data Example

```javascript
// Sample Product
db.products.insertOne({
  name: "Classic Black Blazer",
  description: "Elegant and versatile black blazer for all occasions",
  price: 4999,
  category: "women",
  sizes: ["XS", "S", "M", "L", "XL"],
  images: ["https://res.cloudinary.com/..."],
  model3dUrl: "https://example.com/model.glb",
  stock: 50,
  featured: true,
  createdAt: new Date()
})

// Sample User
db.users.insertOne({
  email: "user@example.com",
  password: "$2b$10$...", // bcrypt hashed
  name: "John Doe",
  role: "user",
  preferences: {
    style: ["minimalist", "elegant"],
    favoriteCategories: ["women", "accessories"]
  },
  createdAt: new Date()
})
```

## Data Validation Rules

### Products
- Price must be > 0
- Stock must be >= 0
- Category must be one of: 'men', 'women', 'new-collection', 'featured'
- At least one image required
- Sizes array cannot be empty

### Orders
- Total amount must match sum of (quantity × price) for all items
- Valid payment status: pending, completed, failed
- Valid order status: processing, shipped, delivered
- Shipping address must have all required fields

### Cart
- Quantity must be > 0
- Size must be valid for the product
- Price must match current product price

## Performance Considerations

1. **Indexing**: Category and userId indexed for fast queries
2. **Pagination**: Implement offset/limit for product listings
3. **Aggregation Pipeline**: Use for complex analytics
4. **Caching**: Consider Redis for cart and user sessions
5. **Archive**: Move old orders to archive collection after 1 year

## Backup Strategy

- Daily automated backups
- Restore point: last 30 days
- MongoDB Atlas for production
