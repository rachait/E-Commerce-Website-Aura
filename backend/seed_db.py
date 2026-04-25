"""
Seed script to populate MongoDB with sample products and users
Run this once to populate the database with demo data
"""

import asyncio
import os
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
    
    force_reseed_products = os.getenv("FORCE_RESEED_PRODUCTS", "false").lower() in {"1", "true", "yes"}
    existing_products = await db.products.count_documents({})
    if existing_products > 0 and not force_reseed_products:
        print(f"✅ Products already exist ({existing_products}), skipping demo product seed")
        print("Tip: set FORCE_RESEED_PRODUCTS=true to refresh demo catalog")
        client.close()
        return

    if force_reseed_products and existing_products > 0:
        await db.products.delete_many({})
        print(f"🧹 Cleared existing products ({existing_products}) before reseeding")

    # Clear existing collections (optional)
    # await db.products.delete_many({})
    
    # High-street inspired catalog using royalty-free Unsplash photos
    sample_products = [
        # WOMEN'S FASHION
        {
            "name": "Structured Oversize Blazer",
            "description": "Double-breasted blazer with sharp shoulders and relaxed drape for a modern city look.",
            "price": 5799,
            "originalPrice": 7299,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1539533057440-7814bae87f16?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1464863979621-258859e62245?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 45,
            "rating": 4.8,
            "reviews": 234,
            "featured": True,
            "sku": "WOM-BLZ-001",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Satin Slip Midi Dress",
            "description": "Bias-cut midi dress with fluid movement and minimal silhouette for evening and event styling.",
            "price": 4699,
            "originalPrice": 6299,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1595905802409-e0286e89f983?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 25,
            "rating": 4.9,
            "reviews": 189,
            "featured": True,
            "sku": "WOM-DRS-004",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Ribbed Cotton Tank",
            "description": "Soft rib-knit tank with stretch fit, perfect as a base layer or standalone summer essential.",
            "price": 1499,
            "originalPrice": 2199,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1542295669297-4d352b042bca?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 55,
            "rating": 4.6,
            "reviews": 156,
            "featured": True,
            "sku": "WOM-TOP-006",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Pleated Occasion Maxi",
            "description": "Flowing pleated maxi dress with subtle shine and elevated drape for festive events.",
            "price": 6999,
            "originalPrice": 8899,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L"],
            "images": [
                "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 15,
            "rating": 5.0,
            "reviews": 98,
            "featured": True,
            "sku": "WOM-MXI-002",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Linen Relaxed Shirt",
            "description": "Breathable linen blend shirt in relaxed cut with rolled cuff styling for day-to-evening wear.",
            "price": 3299,
            "originalPrice": 4399,
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
            "sku": "WOM-SHR-007",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Wide-Leg Tailored Trousers",
            "description": "High-waist wide-leg trousers with front pleats for a clean, elevated day-to-night silhouette.",
            "price": 4199,
            "originalPrice": 5499,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 48,
            "rating": 4.8,
            "reviews": 210,
            "featured": True,
            "sku": "WOM-PNT-011",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Cropped Knit Cardigan",
            "description": "Soft-touch cropped cardigan with pearl buttons for effortless layering in every season.",
            "price": 2899,
            "originalPrice": 3799,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1469460340997-2f854421e72f?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 52,
            "rating": 4.7,
            "reviews": 188,
            "featured": False,
            "sku": "WOM-KNT-004",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Denim Midi Skirt",
            "description": "Front-slit denim midi skirt with structured waist and easy straight fit.",
            "price": 3399,
            "originalPrice": 4599,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 44,
            "rating": 4.6,
            "reviews": 172,
            "featured": False,
            "sku": "WOM-SKT-003",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Belted Trench Coat",
            "description": "Classic belted trench with storm flap and relaxed fit for timeless transitional styling.",
            "price": 7699,
            "originalPrice": 9999,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 30,
            "rating": 4.9,
            "reviews": 141,
            "featured": True,
            "sku": "WOM-CT-002",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Sculpted Evening Blouse",
            "description": "Draped satin blouse with sculpted sleeves and soft sheen for elevated evening outfits.",
            "price": 4599,
            "originalPrice": 6199,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1495385794356-15371f348c31?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 40,
            "rating": 4.8,
            "reviews": 165,
            "featured": True,
            "sku": "WOM-TOP-021",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Tailored Vest Co-ord",
            "description": "Sharp tailored vest with matching separates-inspired cut for premium monochrome styling.",
            "price": 5299,
            "originalPrice": 6899,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["XS", "S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 36,
            "rating": 4.7,
            "reviews": 138,
            "featured": False,
            "sku": "WOM-SET-004",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Boucle Cropped Jacket",
            "description": "Textured boucle jacket with cropped length and structured shoulders for statement layering.",
            "price": 6399,
            "originalPrice": 8199,
            "category": "fashion",
            "subcategory": "women",
            "sizes": ["S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 28,
            "rating": 4.9,
            "reviews": 122,
            "featured": True,
            "sku": "WOM-JCK-018",
            "createdAt": datetime.utcnow()
        },

        # MEN'S FASHION
        {
            "name": "Boxy Poplin Shirt",
            "description": "Crisp poplin shirt with boxy silhouette and dropped shoulder for a polished minimal outfit.",
            "price": 2799,
            "originalPrice": 3599,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1618099238696-0e2e8a4a44ba?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1603252109303-2948979a3a2d?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 65,
            "rating": 4.8,
            "reviews": 276,
            "featured": True,
            "sku": "MEN-SHR-009",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Tapered Smart Trousers",
            "description": "Mid-rise trousers with clean taper and stretch comfort designed for office and off-duty looks.",
            "price": 3899,
            "originalPrice": 5199,
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
            "sku": "MEN-PNT-006",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Utility Cargo Overshirt",
            "description": "Lightweight overshirt with patch pockets and washed texture for contemporary street styling.",
            "price": 4399,
            "originalPrice": 5799,
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
            "sku": "MEN-OVR-003",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Faux Leather Biker Jacket",
            "description": "Structured biker jacket with matte finish and cropped fit inspired by runway streetwear.",
            "price": 7299,
            "originalPrice": 9599,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1520589027891-6eae11418055?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 20,
            "rating": 4.9,
            "reviews": 203,
            "featured": True,
            "sku": "MEN-JCK-008",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Textured Oxford Shirt",
            "description": "Classic oxford with a subtle texture, button-down collar and wearable year-round weight.",
            "price": 3099,
            "originalPrice": 4199,
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
            "sku": "MEN-OXF-005",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Relaxed Straight Jeans",
            "description": "Mid-wash straight-fit jeans with room through the leg and everyday comfort.",
            "price": 3599,
            "originalPrice": 4899,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["28", "30", "32", "34", "36", "38"],
            "images": [
                "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1516826957135-700dedea698c?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 70,
            "rating": 4.7,
            "reviews": 225,
            "featured": False,
            "sku": "MEN-DNM-010",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Merino Crewneck Sweater",
            "description": "Fine-knit crewneck sweater in merino blend for polished layering and lightweight warmth.",
            "price": 3299,
            "originalPrice": 4499,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 58,
            "rating": 4.8,
            "reviews": 177,
            "featured": True,
            "sku": "MEN-KNT-006",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Zip-Up Bomber Jacket",
            "description": "Lightweight bomber with ribbed trims and matte finish for a streamlined street style.",
            "price": 6199,
            "originalPrice": 7899,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1593032457865-9c3e5a2a5392?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 33,
            "rating": 4.8,
            "reviews": 159,
            "featured": True,
            "sku": "MEN-JCK-012",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Resort Cuban Collar Shirt",
            "description": "Relaxed short-sleeve shirt with Cuban collar and breathable weave for vacation-ready outfits.",
            "price": 2599,
            "originalPrice": 3499,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 62,
            "rating": 4.6,
            "reviews": 143,
            "featured": False,
            "sku": "MEN-SHR-014",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Double-Pleat Wool Trousers",
            "description": "Relaxed wool-blend trousers with double pleat front and refined tailoring for premium looks.",
            "price": 4799,
            "originalPrice": 6299,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["28", "30", "32", "34", "36", "38"],
            "images": [
                "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1624878675891-e54e4b4a6143?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 54,
            "rating": 4.8,
            "reviews": 169,
            "featured": True,
            "sku": "MEN-PNT-019",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Heavyweight Hoodie",
            "description": "Premium heavyweight hoodie with clean silhouette and brushed interior comfort.",
            "price": 3999,
            "originalPrice": 5199,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1556821840-3a9fbc4f4d6d?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 68,
            "rating": 4.7,
            "reviews": 152,
            "featured": False,
            "sku": "MEN-HOD-003",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Textured Knit Polo",
            "description": "Short-sleeve knit polo with textured stitch and tailored collar for smart casual styling.",
            "price": 3499,
            "originalPrice": 4599,
            "category": "fashion",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1593032457865-9c3e5a2a5392?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 49,
            "rating": 4.8,
            "reviews": 131,
            "featured": True,
            "sku": "MEN-PLT-005",
            "createdAt": datetime.utcnow()
        },

        # FOOTWEAR
        {
            "name": "Minimal Court Sneakers",
            "description": "Everyday court sneakers with clean upper and cushioned sole for all-day comfort.",
            "price": 4899,
            "originalPrice": 6499,
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
            "sku": "FTW-SNK-011",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Block Heel Sandals",
            "description": "Square-toe block heels with secure straps and balanced height for comfortable evenings.",
            "price": 5599,
            "originalPrice": 7199,
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
            "sku": "FTW-HEL-004",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Classic Penny Loafers",
            "description": "Soft-finish loafers with low-profile sole for business-casual and weekend styling.",
            "price": 4299,
            "originalPrice": 5699,
            "category": "footwear",
            "subcategory": "men",
            "sizes": ["6", "7", "8", "9", "10", "11", "12"],
            "images": [
                "https://images.unsplash.com/photo-1539533057440-7814bae87f16?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1543163521-9efb8cf556f5?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 40,
            "rating": 4.6,
            "reviews": 156,
            "featured": False,
            "sku": "FTW-LOF-007",
            "createdAt": datetime.utcnow()
        },

        # ACCESSORIES
        {
            "name": "Oversized Gradient Sunglasses",
            "description": "Bold gradient lenses with UV400 protection and a lightweight oversized frame.",
            "price": 2299,
            "originalPrice": 3199,
            "category": "accessories",
            "subcategory": "unisex",
            "sizes": ["One Size"],
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
            "sku": "ACC-SGS-010",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Premium Leather Belt",
            "description": "High-quality leather belt with minimalist buckle. Handcrafted.",
            "price": 2499,
            "originalPrice": 3999,
            "category": "accessories",
            "subcategory": "men",
            "sizes": ["S", "M", "L", "XL"],
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
            "name": "Layered Chain Necklace",
            "description": "Polished layered chain design that lifts both casual basics and evening looks.",
            "price": 2899,
            "originalPrice": 4199,
            "category": "accessories",
            "subcategory": "women",
            "sizes": ["One Size"],
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
            "name": "Minimal Hoop Earring Set",
            "description": "Everyday hoop set in three sizes with polished finish and lightweight wear.",
            "price": 1999,
            "originalPrice": 2799,
            "category": "accessories",
            "subcategory": "women",
            "sizes": ["One Size"],
            "images": [
                "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500&h=700&fit=crop"
            ],
            "model3dUrl": None,
            "stock": 60,
            "rating": 4.8,
            "reviews": 234,
            "featured": True,
            "sku": "ACC-EAR-002",
            "createdAt": datetime.utcnow()
        },

        # BAGS
        {
            "name": "Soft Shopper Tote",
            "description": "Roomy structured tote with clean lines and magnetic closure for daily essentials.",
            "price": 6299,
            "originalPrice": 7999,
            "category": "bags",
            "subcategory": "women",
            "sizes": ["One Size"],
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
            "name": "Compact Crossbody Bag",
            "description": "Refined crossbody silhouette with zip top and adjustable strap for travel-light days.",
            "price": 4499,
            "originalPrice": 5999,
            "category": "bags",
            "subcategory": "women",
            "sizes": ["One Size"],
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
            "name": "City Nylon Backpack",
            "description": "Minimal backpack with padded laptop sleeve and smart compartments for daily commute.",
            "price": 4799,
            "originalPrice": 6399,
            "category": "bags",
            "subcategory": "unisex",
            "sizes": ["One Size"],
            "images": [
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=700&fit=crop",
                "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500&h=700&fit=crop",
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

        # BEAUTY
        {
            "name": "Velvet Matte Lip Set",
            "description": "Five-shade matte lip collection with high pigment payoff and smooth non-drying finish.",
            "price": 3199,
            "originalPrice": 4299,
            "category": "makeup",
            "subcategory": "beauty",
            "sizes": ["One Size"],
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
            "name": "Neutral Tone Eye Palette",
            "description": "Wearable neutral shades in matte and shimmer textures designed for day and night looks.",
            "price": 2799,
            "originalPrice": 3899,
            "category": "makeup",
            "subcategory": "beauty",
            "sizes": ["One Size"],
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
            "name": "Hydration Boost Serum",
            "description": "Fast-absorbing serum with hyaluronic complex to support plump and hydrated skin.",
            "price": 2399,
            "originalPrice": 3499,
            "category": "makeup",
            "subcategory": "beauty",
            "sizes": ["One Size"],
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
            "name": "Barrier Repair Face Cream",
            "description": "Rich daily moisturizer with ceramides and niacinamide for smoother, calmer skin.",
            "price": 2999,
            "originalPrice": 4199,
            "category": "makeup",
            "subcategory": "beauty",
            "sizes": ["One Size"],
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
