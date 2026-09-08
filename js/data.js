/* =========================================================
   SHADHER GHOR - CATALOG DATA
   Authentic street food menu for Shadher Ghor, Agartala.
   ========================================================= */

const CATEGORIES = [
  { id: "momo", name: "Momo", icon: "fa-solid fa-bowl-food", tag: "Steamed & fried" },
  { id: "chowmein", name: "Chowmein", icon: "fa-solid fa-utensils", tag: "Noodles & stir-fry" },
  { id: "biryani", name: "Biryani", icon: "fa-solid fa-utensil-spoon", tag: "Flavorful rice dishes" },
  { id: "burgers", name: "Burgers & Sandwiches", icon: "fa-solid fa-burger", tag: "Loaded & fresh" },
  { id: "rolls", name: "Rolls & Wraps", icon: "fa-solid fa-hotdog", tag: "Street-style rolls" },
  { id: "snacks", name: "Snacks & Sides", icon: "fa-solid fa-french-fries", tag: "Perfect bites" },
  { id: "beverages", name: "Beverages", icon: "fa-solid fa-mug-saucer", tag: "Cool drinks & more" },
  { id: "combo", name: "Combo Meals", icon: "fa-solid fa-bag-shopping", tag: "Best value deals" },
];

const PRODUCTS = [

  /* ===================== MOMO COLLECTION ===================== */
  { id: "m1", name: "Classic Chicken Momo", desc: "Steamed chicken momos served with spicy tomato chutney and garlic dip.", category: "momo", rating: 4.8, badge: "Bestseller", icon: "fa-solid fa-bowl-food", basePrice: 100, sizes: [{ label: "1 Plate (6 pcs)", price: 100 }, { label: "1.5 Plate (9 pcs)", price: 150 }] },
  { id: "m2", name: "Paneer Momo", desc: "Steamed momos with a rich paneer filling, served with three chutneys.", category: "momo", rating: 4.7, badge: "Popular", icon: "fa-solid fa-bowl-food", basePrice: 120, sizes: [{ label: "1 Plate (6 pcs)", price: 120 }, { label: "1.5 Plate (9 pcs)", price: 180 }] },
  { id: "m3", name: "Veg Momo", desc: "Classic steamed momos with a mixed vegetable filling, light and fresh.", category: "momo", rating: 4.6, icon: "fa-solid fa-bowl-food", basePrice: 90, sizes: [{ label: "1 Plate (6 pcs)", price: 90 }, { label: "1.5 Plate (9 pcs)", price: 135 }] },
  { id: "m4", name: "Fried Chicken Momo", desc: "Crispy fried chicken momos with a spicy schezwan dip on the side.", category: "momo", rating: 4.7, badge: "Popular", icon: "fa-solid fa-bowl-food", basePrice: 120, sizes: [{ label: "1 Plate (6 pcs)", price: 120 }, { label: "1.5 Plate (9 pcs)", price: 180 }] },
  { id: "m5", name: "Kurkure Momo", desc: "Crispy coated fried momos with crunchy noodles on top, a fan favorite.", category: "momo", rating: 4.8, badge: "Bestseller", icon: "fa-solid fa-bowl-food", basePrice: 140, sizes: [{ label: "1 Plate (6 pcs)", price: 140 }, { label: "1.5 Plate (9 pcs)", price: 210 }] },
  { id: "m6", name: "Chicken Cheese Momo", desc: "Steamed momos with chicken and cheese filling, creamy and flavorful.", category: "momo", rating: 4.6, icon: "fa-solid fa-bowl-food", basePrice: 130, sizes: [{ label: "1 Plate (6 pcs)", price: 130 }, { label: "1.5 Plate (9 pcs)", price: 195 }] },

  /* ===================== CHOWMEIN COLLECTION ===================== */
  { id: "c1", name: "Chicken Hakka Noodles", desc: "Classic Hakka noodles stir-fried with chicken, veggies and soy sauce.", category: "chowmein", rating: 4.7, badge: "Bestseller", icon: "fa-solid fa-utensils", basePrice: 150, sizes: [{ label: "Regular", price: 150 }, { label: "Large", price: 220 }] },
  { id: "c2", name: "Veg Hakka Noodles", desc: "Fresh stir-fried noodles with crunchy vegetables and aromatic spices.", category: "chowmein", rating: 4.6, icon: "fa-solid fa-utensils", basePrice: 120, sizes: [{ label: "Regular", price: 120 }, { label: "Large", price: 180 }] },
  { id: "c3", name: "Schezwan Noodles", desc: "Spicy schezwan style noodles with chicken and extra veggies.", category: "chowmein", rating: 4.6, icon: "fa-solid fa-utensils", basePrice: 160, sizes: [{ label: "Regular", price: 160 }, { label: "Large", price: 240 }] },
  { id: "c4", name: "Chicken Singapore Noodles", desc: "Curry-flavored rice noodles with chicken, shrimp and vegetables.", category: "chowmein", rating: 4.5, icon: "fa-solid fa-utensils", basePrice: 180, sizes: [{ label: "Regular", price: 180 }, { label: "Large", price: 260 }] },

  /* ===================== BIRYANI COLLECTION ===================== */
  { id: "b1", name: "Chicken Biryani", desc: "Aromatic basmati rice layered with succulent chicken, herbs and spices.", category: "biryani", rating: 4.8, badge: "Bestseller", icon: "fa-solid fa-utensil-spoon", basePrice: 200, sizes: [{ label: "Regular", price: 200 }, { label: "Large", price: 300 }] },
  { id: "b2", name: "Mutton Biryani", desc: "Tender mutton biryani with a rich, flavorful masala and fragrant rice.", category: "biryani", rating: 4.7, badge: "Popular", icon: "fa-solid fa-utensil-spoon", basePrice: 280, sizes: [{ label: "Regular", price: 280 }, { label: "Large", price: 400 }] },
  { id: "b3", name: "Veg Biryani", desc: "Aromatic biryani with mixed vegetables, paneer and a hint of saffron.", category: "biryani", rating: 4.6, icon: "fa-solid fa-utensil-spoon", basePrice: 160, sizes: [{ label: "Regular", price: 160 }, { label: "Large", price: 240 }] },
  { id: "b4", name: "Egg Biryani", desc: "Flavorful biryani with boiled eggs and layers of spiced rice.", category: "biryani", rating: 4.5, icon: "fa-solid fa-utensil-spoon", basePrice: 170, sizes: [{ label: "Regular", price: 170 }, { label: "Large", price: 250 }] },
  { id: "b5", name: "Chicken Tikka Biryani", desc: "Biryani with marinated chicken tikka pieces, smoky and aromatic.", category: "biryani", rating: 4.7, icon: "fa-solid fa-utensil-spoon", basePrice: 250, sizes: [{ label: "Regular", price: 250 }, { label: "Large", price: 360 }] },

  /* ===================== BURGERS & SANDWICHES ===================== */
  { id: "bu1", name: "Chicken Cheeseburger", desc: "Grilled chicken patty with cheese, lettuce, tomato and special sauce.", category: "burgers", rating: 4.7, badge: "Bestseller", icon: "fa-solid fa-burger", basePrice: 140, sizes: [{ label: "Single", price: 140 }, { label: "Double", price: 220 }] },
  { id: "bu2", name: "Veg Burger", desc: "Crispy veg patty with cheese, lettuce and house-made sauce.", category: "burgers", rating: 4.5, icon: "fa-solid fa-burger", basePrice: 110, sizes: [{ label: "Single", price: 110 }, { label: "Double", price: 180 }] },
  { id: "bu3", name: "Chicken Club Sandwich", desc: "Triple layer sandwich with grilled chicken, bacon, lettuce and tomato.", category: "burgers", rating: 4.6, icon: "fa-solid fa-burger", basePrice: 160, sizes: [{ label: "Regular", price: 160 }] },
  { id: "bu4", name: "Paneer Tikka Sandwich", desc: "Grilled paneer tikka with mint chutney and fresh vegetables.", category: "burgers", rating: 4.5, icon: "fa-solid fa-burger", basePrice: 130, sizes: [{ label: "Regular", price: 130 }] },

  /* ===================== ROLLS & WRAPS ===================== */
  { id: "r1", name: "Chicken Shawarma Roll", desc: "Juicy chicken shawarma with garlic sauce, wrapped in a soft roll.", category: "rolls", rating: 4.7, badge: "Popular", icon: "fa-solid fa-hotdog", basePrice: 120, sizes: [{ label: "Regular", price: 120 }, { label: "Large", price: 180 }] },
  { id: "r2", name: "Paneer Tikka Roll", desc: "Grilled paneer tikka with mint sauce and crunchy onions in a wrap.", category: "rolls", rating: 4.6, icon: "fa-solid fa-hotdog", basePrice: 130, sizes: [{ label: "Regular", price: 130 }, { label: "Large", price: 190 }] },
  { id: "r3", name: "Chicken Kathi Roll", desc: "Spicy chicken filling with eggs and onions in a paratha wrap.", category: "rolls", rating: 4.7, icon: "fa-solid fa-hotdog", basePrice: 140, sizes: [{ label: "Regular", price: 140 }, { label: "Large", price: 200 }] },
  { id: "r4", name: "Veg Kathi Roll", desc: "Mixed vegetable filling with cheese and herbs in a paratha wrap.", category: "rolls", rating: 4.5, icon: "fa-solid fa-hotdog", basePrice: 110, sizes: [{ label: "Regular", price: 110 }, { label: "Large", price: 160 }] },

  /* ===================== SNACKS & SIDES ===================== */
  { id: "s1", name: "Chicken Fry", desc: "Crispy fried chicken pieces with a spicy coating, served with dip.", category: "snacks", rating: 4.7, badge: "Bestseller", icon: "fa-solid fa-french-fries", basePrice: 180, sizes: [{ label: "Regular", price: 180 }, { label: "Large", price: 260 }] },
  { id: "s2", name: "French Fries", desc: "Crispy golden fries, lightly salted and served with ketchup.", category: "snacks", rating: 4.4, icon: "fa-solid fa-french-fries", basePrice: 80, sizes: [{ label: "Regular", price: 80 }, { label: "Large", price: 120 }] },
  { id: "s3", name: "Chicken Wings", desc: "Spicy chicken wings, fried to perfection with a smoky BBQ glaze.", category: "snacks", rating: 4.6, icon: "fa-solid fa-french-fries", basePrice: 200, sizes: [{ label: "6 pcs", price: 200 }, { label: "12 pcs", price: 360 }] },
  { id: "s4", name: "Paneer Chilly", desc: "Crispy paneer tossed in a spicy chilly sauce with bell peppers.", category: "snacks", rating: 4.5, icon: "fa-solid fa-french-fries", basePrice: 160, sizes: [{ label: "Regular", price: 160 }, { label: "Large", price: 240 }] },
  { id: "s5", name: "Chicken Chilly", desc: "Boneless chicken pieces tossed in a spicy, tangy chilly sauce.", category: "snacks", rating: 4.6, icon: "fa-solid fa-french-fries", basePrice: 190, sizes: [{ label: "Regular", price: 190 }, { label: "Large", price: 280 }] },

  /* ===================== BEVERAGES ===================== */
  { id: "be1", name: "Sweet Lassi", desc: "Thick and creamy sweet lassi, a perfect complement to spicy food.", category: "beverages", rating: 4.5, icon: "fa-solid fa-mug-saucer", basePrice: 60, sizes: [{ label: "Small", price: 60 }, { label: "Large", price: 100 }] },
  { id: "be2", name: "Mango Lassi", desc: "Rich lassi with ripe mango pulp, sweet and refreshing.", category: "beverages", rating: 4.6, icon: "fa-solid fa-mug-saucer", basePrice: 80, sizes: [{ label: "Small", price: 80 }, { label: "Large", price: 130 }] },
  { id: "be3", name: "Cold Coffee", desc: "Chilled coffee with a hint of sweetness, topped with cream.", category: "beverages", rating: 4.4, icon: "fa-solid fa-mug-saucer", basePrice: 70, sizes: [{ label: "Small", price: 70 }, { label: "Large", price: 110 }] },
  { id: "be4", name: "Masala Chai", desc: "Classic Indian tea with aromatic spices, perfect any time of day.", category: "beverages", rating: 4.7, icon: "fa-solid fa-mug-saucer", basePrice: 30, sizes: [{ label: "Small", price: 30 }, { label: "Large", price: 50 }] },
  { id: "be5", name: "Fresh Lime Soda", desc: "Fresh lime juice with soda water and a hint of mint and salt.", category: "beverages", rating: 4.3, icon: "fa-solid fa-mug-saucer", basePrice: 50, sizes: [{ label: "Regular", price: 50 }] },

  /* ===================== COMBO MEALS ===================== */
  { id: "co1", name: "Momo Combo - 2 Plates", desc: "2 plates of any momo variety with extra chutney and a cold drink.", category: "combo", rating: 4.8, badge: "Popular", icon: "fa-solid fa-bag-shopping", basePrice: 220, sizes: [{ label: "Combo (2 plates + drink)", price: 220 }] },
  { id: "co2", name: "Biryani Combo", desc: "Biryani served with raita, salad and a cold drink of your choice.", category: "combo", rating: 4.7, icon: "fa-solid fa-bag-shopping", basePrice: 280, sizes: [{ label: "Combo (Biryani + sides + drink)", price: 280 }] },
  { id: "co3", name: "Chowmein + Chicken Fry Combo", desc: "Chicken chowmein served with crispy chicken fry and a drink.", category: "combo", rating: 4.8, badge: "Bestseller", icon: "fa-solid fa-bag-shopping", basePrice: 320, sizes: [{ label: "Combo (Chowmein + Fry + drink)", price: 320 }] },
  { id: "co4", name: "Burger + Fries Combo", desc: "Chicken burger with crispy fries and a cold drink.", category: "combo", rating: 4.6, icon: "fa-solid fa-bag-shopping", basePrice: 200, sizes: [{ label: "Combo (Burger + Fries + drink)", price: 200 }] },
  { id: "co5", name: "Snack Platter Combo", desc: "Chicken fry, wings, momos and fries - a perfect sharing platter.", category: "combo", rating: 4.7, icon: "fa-solid fa-bag-shopping", basePrice: 450, sizes: [{ label: "Large Platter (serves 2-3)", price: 450 }] },
  { id: "co6", name: "Roll + Lassi Combo", desc: "Any roll of your choice served with a sweet or mango lassi.", category: "combo", rating: 4.5, icon: "fa-solid fa-bag-shopping", basePrice: 180, sizes: [{ label: "Combo (Roll + Lassi)", price: 180 }] },
];

const DELIVERY_FEE = 39;
const FREE_DELIVERY_ABOVE = 499;

/* WhatsApp number */
const WHATSAPP_NUMBERS = {
  primary: "918794398516",
};

/* Store & social links */
const STORE_NAME = "Shadher Ghor";
const STORE_ADDRESS = "NH 108B, Radha Nagar, Agartala, Tripura 799001";
const STORE_LAT = 23.845906;
const STORE_LNG = 91.283050;
const MAP_LINK = "https://maps.app.goo.gl/qjv4cav9pDzmrN9o8";
const MAP_DIRECTIONS_LINK = "https://www.google.com/maps/dir/?api=1&destination=" + STORE_LAT + "," + STORE_LNG;
const GOOGLE_REVIEW_LINK = "https://maps.app.goo.gl/qjv4cav9pDzmrN9o8";
const INSTAGRAM_LINK = "https://www.instagram.com/shadherghor";
const FACEBOOK_LINK = "https://www.facebook.com/shadherghor";

/* Highlights shown on the home screen */
const HIGHLIGHTS = [
  { icon: "fa-solid fa-star", text: "Authentic recipes, fresh ingredients" },
  { icon: "fa-solid fa-truck-fast", text: "Fast & reliable delivery in Agartala" },
  { icon: "fa-solid fa-bowl-food", text: "Generous portions, honest prices" },
  { icon: "fa-solid fa-heart", text: "Made with love, served with pride" },
];

/* Special offers / promo banners */
const OFFERS = [
  { id: "off1", icon: "fa-solid fa-truck-fast", title: "Free Delivery", sub: "Automatically applied on all orders above ₹499", tag: "Auto-applied" },
  { id: "off2", icon: "fa-solid fa-gift", title: "Combo Deals", sub: "Get 15% off on all combo meals", tag: "Limited Time" },
  { id: "off3", icon: "fa-solid fa-bowl-food", title: "Weekend Special", sub: "Order 2 items and get a free drink", tag: "Weekend Only" },
];