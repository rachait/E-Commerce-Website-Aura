"""
Seed script to populate MongoDB with sample products and users
Run this once to populate the database with demo data
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from app.utils.auth import hash_password
from config import settings

async def seed_database():
    try:
        client = AsyncIOMotorClient(settings.MONGO_URL)
        db = client[settings.DB_NAME]
        
        print("🌱 Starting database seeding...")
    except Exception as e:
        print(f"⚠️  Cannot connect to MongoDB: {str(e)}")
        print("Database seeding will be skipped. Please ensure MongoDB is running on localhost:27017")
        return
    
    existing_products = await db.products.count_documents({})
    if existing_products > 0:
        print(f"✅ Products already exist ({existing_products}), skipping demo product seed")
        client.close()
        return

    # Clear existing collections (optional)
    # await db.products.delete_many({})
    
    # Comprehensive product catalog with multiple images
    sample_products = [
        # WOMEN'S FASHION
        {
            "name": "Noir Elegance Jacket",
            "description": "Premium black blazer with precision tailoring. Perfect for formal occasions or elevating your everyday look.",
            "price": 5999,
            "originalPrice": 7499,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1539533057440-7814bae87f16?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1592921570552-8ac40e632719?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 45,
            "rating": 4.8,
            "reviews": 234,
            "featured": True,
            "sku": "WOM-JAC-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Cyber Neon Dress",
            "description": "Futuristic design with iridescent fabric that catches light beautifully. Statement piece for the fashion-forward.",
            "price": 7999,
            "originalPrice": 9999,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1595777707802-c426b58519ff?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1595905802409-e0286e89f983?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 25,
            "rating": 4.9,
            "reviews": 189,
            "featured": True,
            "sku": "WOM-DRS-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Crystal Cami Top",
            "description": "Shimmering camisole with adjustable straps. Versatile piece that works with everything.",
            "price": 1999,
            "originalPrice": 2499,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1595959183673-deb107953faf?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 55,
            "rating": 4.6,
            "reviews": 156,
            "featured": True,
            "sku": "WOM-TOP-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Silk Evening Gown",
            "description": "Luxury silk with floor-length elegance. Your perfect companion for special occasions.",
            "price": 12999,
            "originalPrice": 16999,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L"],
            "images": [
                "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1595905802409-e0286e89f983?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 15,
            "rating": 5.0,
            "reviews": 98,
            "featured": True,
            "sku": "WOM-GWN-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Casual White Linen Shirt",
            "description": "Breathable linen fabric perfect for warm weather. Timeless style that matches anything.",
            "price": 3499,
            "originalPrice": 4499,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1605014162267-f8dd9ddd1e3d?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1594938676000-ac5f4bd0e1f9?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1595909868104-16da51e45100?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 60,
            "rating": 4.7,
            "reviews": 134,
            "featured": False,
            "sku": "WOM-SHR-001",
            "createdAt": datetime.utcnow()
        },

        # MEN'S FASHION
        {
            "name": "Monochrome Minimalist Shirt",
            "description": "Clean lines, perfect fit, versatile style. The foundation of every wardrobe.",
            "price": 2499,
            "originalPrice": 3499,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1618099238696-0e2e8a4a44ba?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1603252109303-2948979a3a2d?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 65,
            "rating": 4.8,
            "reviews": 276,
            "featured": True,
            "sku": "MEN-SHR-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Sleek Black Trousers",
            "description": "Tailored fit with modern silhouette. Perfect for casual or formal settings.",
            "price": 3999,
            "originalPrice": 5499,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["28", "30", "32", "34", "36", "38"],
            "images": [
                "https://images.unsplash.com/photo-1624878675891-e54e4b4a6143?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1605236453806-6ff36e7ef945?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1624878500838-a3873b19d65a?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 75,
            "rating": 4.9,
            "reviews": 312,
            "featured": False,
            "sku": "MEN-PNT-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Urban Cargo Vest",
            "description": "Functional pockets with contemporary design. Perfect layering piece.",
            "price": 4499,
            "originalPrice": 5999,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1617299785154-5db81876b0e4?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1592921570552-8ac40e632719?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 35,
            "rating": 4.7,
            "reviews": 145,
            "featured": False,
            "sku": "MEN-VST-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Leather Statement Jacket",
            "description": "Premium leather with bold design. Classic piece that lasts a lifetime.",
            "price": 9999,
            "originalPrice": 12999,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1520589027891-6eae11418055?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1520589027891-6eae11418056?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 20,
            "rating": 4.9,
            "reviews": 203,
            "featured": True,
            "sku": "MEN-JCK-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Oxford Cotton Shirt",
            "description": "Classic Oxford weave shirt. Perfect for business casual or weekend wear.",
            "price": 2999,
            "originalPrice": 4499,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 50,
            "rating": 4.8,
            "reviews": 189,
            "featured": True,
            "sku": "MEN-OXF-001",
            "createdAt": datetime.utcnow()
        },

        # FOOTWEAR
        {
            "name": "Luxury White Sneakers",
            "description": "Premium white leather sneakers with minimalist design. Comfortable and stylish.",
            "price": 4999,
            "originalPrice": 6999,
            "category": "footwear",
            "subcategory": "unisex",
            "sizes": ["5", "6", "7", "8", "9", "10", "11", "12"],
            "images": [
                "https://images.unsplash.com/photo-1549298881-0b6b2a6be8d6?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1600181534506-af15f1c241c9?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 45,
            "rating": 4.9,
            "reviews": 467,
            "featured": True,
            "sku": "FTW-SNK-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Elegant Black Heels",
            "description": "Classic black heels with cushioned insole. Perfect for any occasion.",
            "price": 6999,
            "originalPrice": 8999,
            "category": "footwear",
            "subcategory": "women",
            "sizes": ["5", "6", "7", "8", "9", "10", "11"],
            "images": [
                "https://images.unsplash.com/photo-1543163521-9efb8cf556f1?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1511104389949-567a5dcc67b2?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1527282083360-acd1ba11e234?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 35,
            "rating": 4.7,
            "reviews": 234,
            "featured": True,
            "sku": "FTW-HEL-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Casual Brown Loafers",
            "description": "Comfortable leather loafers. Perfect for daily wear.",
            "price": 3999,
            "originalPrice": 5499,
            "category": "footwear",
            "subcategory": "men",
            "sizes": ["6", "7", "8", "9", "10", "11", "12"],
            "images": [
                "https://images.unsplash.com/photo-1539533057440-7814bae87f16?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1543163521-9efb8cf556f5?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 40,
            "rating": 4.6,
            "reviews": 156,
            "featured": False,
            "sku": "FTW-LOF-001",
            "createdAt": datetime.utcnow()
        },

        # ACCESSORIES
        {
            "name": "Silk Sleep Mask",
            "description": "Luxurious silk sleep mask for better comfort. Travel essential.",
            "price": 1499,
            "originalPrice": 1999,
            "category": "accessories",
            "subcategory": "unisex",
            "images": [
                "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1584411612384-c2f1a87b2f89?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 100,
            "rating": 4.8,
            "reviews": 312,
            "featured": True,
            "sku": "ACC-MSK-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Premium Leather Belt",
            "description": "High-quality leather belt with minimalist buckle. Handcrafted.",
            "price": 2499,
            "originalPrice": 3999,
            "category": "accessories",
            "subcategory": "men",
            "images": [
                "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1584411612384-c2f1a87b2f89?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1591995635433-e707b96a94f8?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 80,
            "rating": 4.9,
            "reviews": 289,
            "featured": True,
            "sku": "ACC-BLT-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Gold Statement Necklace",
            "description": "Elegant gold necklace that adds sophistication to any outfit.",
            "price": 3999,
            "originalPrice": 5999,
            "category": "accessories",
            "subcategory": "women",
            "images": [
                "https://images.unsplash.com/photo-1503803706585-d4a58fb51c38?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1478384544e4-20305f81f75f?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 50,
            "rating": 4.7,
            "reviews": 178,
            "featured": True,
            "sku": "ACC-NKL-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Designer Sunglasses",
            "description": "UV-protected designer sunglasses with titanium frame.",
            "price": 4999,
            "originalPrice": 7999,
            "category": "accessories",
            "subcategory": "unisex",
            "images": [
                "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1572635196237-14b3f281503e?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 60,
            "rating": 4.8,
            "reviews": 234,
            "featured": True,
            "sku": "ACC-SGS-001",
            "createdAt": datetime.utcnow()
        },

        # BAGS
        {
            "name": "Luxury Leather Tote Bag",
            "description": "Spacious leather tote perfect for work and travel. Premium craftsmanship.",
            "price": 8999,
            "originalPrice": 11999,
            "category": "bags",
            "subcategory": "women",
            "images": [
                "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1548036328-c9fa89d128fb?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 25,
            "rating": 4.9,
            "reviews": 267,
            "featured": True,
            "sku": "BAG-TOT-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Crossbody Shoulder Bag",
            "description": "Sleek crossbody bag with adjustable strap. Perfect for on-the-go.",
            "price": 5999,
            "originalPrice": 7999,
            "category": "bags",
            "subcategory": "women",
            "images": [
                "https://images.unsplash.com/photo-1584308666744-24d5f400f6f6?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 40,
            "rating": 4.8,
            "reviews": 198,
            "featured": True,
            "sku": "BAG-CRS-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Classic Black Backpack",
            "description": "Versatile backpack with laptop compartment. Ideal for work and travel.",
            "price": 4999,
            "originalPrice": 6999,
            "category": "bags",
            "subcategory": "unisex",
            "images": [
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1603803905925-a643ee披-4f6f-4899-8908-b6b6a7ebc76c?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1567042871519-905f4bab199d?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 50,
            "rating": 4.7,
            "reviews": 312,
            "featured": False,
            "sku": "BAG-BKP-001",
            "createdAt": datetime.utcnow()
        },

        # MAKEUP & BEAUTY
        {
            "name": "Luxury Lipstick Set",
            "description": "Collection of 5 premium lipsticks in trending shades. Long-lasting formula.",
            "price": 3999,
            "originalPrice": 5499,
            "category": "makeup",
            "subcategory": "beauty",
            "images": [
                "https://images.unsplash.com/photo-1565958011504-98d7945f9d5a?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 75,
            "rating": 4.9,
            "reviews": 456,
            "featured": True,
            "sku": "MKP-LPS-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Premium Eye Shadow Palette",
            "description": "16-color eyeshadow palette with matte and shimmer finishes.",
            "price": 2999,
            "originalPrice": 4499,
            "category": "makeup",
            "subcategory": "beauty",
            "images": [
                "https://images.unsplash.com/photo-1580707314755-ed2a79c46e9e?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1565958011504-98d7945f9d5a?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 85,
            "rating": 4.8,
            "reviews": 345,
            "featured": True,
            "sku": "MKP-PLT-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Hydrating Face Serum",
            "description": "Lightweight serum with hyaluronic acid. Hydrates and rejuvenates skin.",
            "price": 2499,
            "originalPrice": 3999,
            "category": "makeup",
            "subcategory": "beauty",
            "images": [
                "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1512909995516-3f0dc7ecc4c5?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1575655289734-dc1c5e9e5ceb?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 95,
            "rating": 4.7,
            "reviews": 289,
            "featured": False,
            "sku": "MKP-SRM-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Luxe Face Cream",
            "description": "Rich moisturizer with anti-aging benefits. Suitable for all skin types.",
            "price": 3499,
            "originalPrice": 5299,
            "category": "makeup",
            "subcategory": "beauty",
            "images": [
                "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1556228578-8c89e6adf884?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1556228920-75bba5ae3c35?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 70,
            "rating": 4.9,
            "reviews": 412,
            "featured": True,
            "sku": "MKP-CRM-001",
            "createdAt": datetime.utcnow()
        }
    ]
    
    # Insert products
    result = await db.products.insert_many(sample_products)
    print(f"✅ Inserted {len(result.inserted_ids)} products")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.products.create_index("category")
    await db.orders.create_index("userId")
    await db.cart.create_index("userId", unique=True)
    print("✅ Created indexes")
    
    # Check admin user
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        admin_doc = {
            "email": "admin@aura.com",
            "password": hash_password("admin123"),
            "name": "Admin User",
            "role": "admin",
            "preferences": {
                "style": ["trendy", "minimal"],
                "favoriteCategories": ["women", "men"]
            },
            "createdAt": datetime.utcnow()
        }
        await db.users.insert_one(admin_doc)
        print("✅ Admin user created: admin@aura.com / admin123")
    else:
        print("✅ Admin user already exists")
    
    # Create sample user
    user = await db.users.find_one({"email": "user@example.com"})
    if not user:
        user_doc = {
            "email": "user@example.com",
            "password": hash_password("password123"),
            "name": "John Doe",
            "role": "user",
            "preferences": {
                "style": ["minimalist", "elegant"],
                "favoriteCategories": ["women"]
            },
            "createdAt": datetime.utcnow()
        }
        await db.users.insert_one(user_doc)
        print("✅ Sample user created: user@example.com / password123")
    
    print("\n🌟 Database seeding complete!")
    print("\nTest Credentials:")
    print("  Admin: admin@aura.com / admin123")
    print("  User:  user@example.com / password123")
    
    client.close()

if __name__ == "__main__":
    try:
        asyncio.run(seed_database())
    except Exception as e:
        print(f"\n⚠️  Database seeding failed: {str(e)}")
        print("The backend will start anyway, but MongoDB needs to be running for full functionality.")
        print("You can start the backend manually with: uvicorn main:app --reload")
