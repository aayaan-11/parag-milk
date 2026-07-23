import { Product, Blog } from './types';
import paragGoldMilkImg from './assets/images/parag_gold_milk_1784699759742.jpg';
import paragTaazaMilkImg from './assets/images/parag_taaza_milk_1784699771059.jpg';
import paragMeethaDahiImg from './assets/images/parag_meetha_dahi_1784699782266.jpg';
import paragPlainDahiImg from './assets/images/parag_plain_dahi_1784699792186.jpg';
import paragBesanLadooImg from './assets/images/parag_besan_ladoo_1784699811495.jpg';
import paragChhenaKheerImg from './assets/images/parag_chhena_kheer_1784699822480.jpg';
import paragShrikhandImg from './assets/images/parag_shrikhand_1784699835112.jpg';

export const CATEGORIES = [
  { id: 'milk', name: 'Milk', count: 2, icon: 'Milk' },
  { id: 'dahi', name: 'Dahi', count: 2, icon: 'Flame' },
  { id: 'sweets', name: 'Sweets', count: 3, icon: 'Sparkles' }
];

export const PRODUCTS: Product[] = [
  {
    id: 'm1',
    name: 'PARAG FULL CREAM MILK',
    category: 'milk',
    price: 69,
    originalPrice: 72,
    unit: '1L',
    rating: 4.9,
    reviewsCount: 1420,
    image: paragGoldMilkImg,
    description: 'Fresh and creamy premium full cream milk, homogenized and pasteurized to perfection. Rich in essential calcium and vitamins, perfect for starting your day or preparing traditional desserts.',
    benefits: ['Rich in energy and healthy fats', 'Essential for bone and teeth health', '100% pure milk without any chemical preservatives', 'Sourced directly from certified dairy farms'],
    ingredients: ['Standardized Pasteurized Milk', 'Vitamin A', 'Vitamin D2'],
    nutrition: {
      energy: '74 kcal',
      protein: '3.2 g',
      fat: '6.0 g',
      carbohydrates: '4.8 g',
      calcium: '120 mg'
    },
    storage: 'Keep refrigerated between 1°C and 4°C. Consume within 48 hours of opening.',
    available: true,
    bestSeller: true,
    featured: true,
    organic: false,
    proteinRich: false
  },
  {
    id: 'm2',
    name: 'PARAG TONED MILK',
    category: 'milk',
    price: 59,
    originalPrice: 62,
    unit: '1L',
    rating: 4.7,
    reviewsCount: 940,
    image: paragTaazaMilkImg,
    description: 'Sourced from selected high-breed cows, Parag Toned Milk is naturally sweet, light, and easy to digest. Ideal for tea, coffee, and everyday drinking.',
    benefits: ['Easily digestible proteins', 'Sourced from healthy, well-fed grass-fed cows', 'Rich in natural Vitamin A', 'Low calorie daily hydration'],
    ingredients: ['Fresh Pasteurized Toned Milk'],
    nutrition: {
      energy: '58 kcal',
      protein: '3.1 g',
      fat: '3.0 g',
      carbohydrates: '4.7 g',
      calcium: '115 mg'
    },
    storage: 'Keep refrigerated under 4°C at all times.',
    available: true,
    bestSeller: true,
    featured: false,
    organic: false,
    proteinRich: false
  },
  {
    id: 'd1',
    name: 'PARAG SWEET DAHI',
    category: 'dahi',
    price: 10,
    unit: '90GM',
    rating: 4.8,
    reviewsCount: 680,
    image: paragMeethaDahiImg,
    description: 'Deliciously thick and creamy sweet curd set naturally. Extremely rich in gut-healthy probiotics, making it a perfect quick sweet dessert after a meal.',
    benefits: ['Improves digestion with live active cultures', 'Convenient 90GM single-serve container', 'Thick and creamy texture without starch', 'Low sourness index for sweet natural taste'],
    ingredients: ['Pasteurized Double Toned Milk', 'Sugar', 'Active Lactic Cultures'],
    nutrition: {
      energy: '85 kcal',
      protein: '3.0 g',
      fat: '3.1 g',
      carbohydrates: '12.0 g',
      calcium: '110 mg'
    },
    storage: 'Store in refrigerator below 4°C.',
    available: true,
    bestSeller: true,
    featured: true,
    organic: false,
    proteinRich: false
  },
  {
    id: 'd2',
    name: 'PLAIN DAHI',
    category: 'dahi',
    price: 23,
    originalPrice: 25,
    unit: '200 GM',
    rating: 4.9,
    reviewsCount: 1120,
    image: paragPlainDahiImg,
    description: 'Thick, creamy, and uniform plain curd set naturally. Perfect side for biryanis, parathas, and regular Indian home cooked meals.',
    benefits: ['Improves digestion with live active cultures', 'Thick traditional texture', 'Source of clean calcium and protein', 'Zero added sugar'],
    ingredients: ['Pasteurized Milk', 'Active Lactic Cultures'],
    nutrition: {
      energy: '60 kcal',
      protein: '3.5 g',
      fat: '3.1 g',
      carbohydrates: '4.4 g',
      calcium: '135 mg'
    },
    storage: 'Store in the refrigerator below 4°C. Consume within 3 days of opening.',
    available: true,
    bestSeller: true,
    featured: true,
    organic: false,
    proteinRich: false
  },
  {
    id: 's1',
    name: 'BESAN LADOO',
    category: 'sweets',
    price: 125,
    originalPrice: 135,
    unit: '25GM',
    rating: 4.8,
    reviewsCount: 1540,
    image: paragBesanLadooImg,
    description: 'Delectable Indian traditional sweet made of roasted gram flour (besan), pure desi ghee, and premium cardamoms. Melt-in-the-mouth textured treats.',
    benefits: ['Made with 100% pure desi ghee', 'Rich authentic traditional recipe', 'Perfect sweet treat for festivals and celebrations', 'Mouthwatering cardamom aroma'],
    ingredients: ['Gram Flour', 'Desi Ghee', 'Sugar', 'Cardamom'],
    nutrition: {
      energy: '142 kcal',
      protein: '2.5 g',
      fat: '8.0 g',
      carbohydrates: '15.0 g',
      calcium: '15 mg'
    },
    storage: 'Store in a cool dry place. Do not refrigerate to preserve soft texture.',
    available: true,
    bestSeller: true,
    featured: true,
    organic: false,
    proteinRich: false
  },
  {
    id: 's2',
    name: 'KHEER',
    category: 'sweets',
    price: 30,
    unit: '100GM',
    rating: 4.9,
    reviewsCount: 2010,
    image: paragChhenaKheerImg,
    description: 'Thick, creamy traditional rice pudding simmered with fresh full cream milk, saffron, cardamoms, and topped with chopped almonds and pistachios.',
    benefits: ['Simmered slowly for hours to get rich consistency', 'Flavoured with natural saffron and green cardamom', 'Nutritious comforting sweet dessert', 'Convenient and hygienic ready-to-eat cup'],
    ingredients: ['Full Cream Milk', 'Basmati Rice', 'Sugar', 'Almonds', 'Pistachios', 'Saffron', 'Cardamom'],
    nutrition: {
      energy: '128 kcal',
      protein: '3.1 g',
      fat: '4.5 g',
      carbohydrates: '18.5 g',
      calcium: '95 mg'
    },
    storage: 'Store refrigerated below 4°C. Serve chilled.',
    available: true,
    bestSeller: true,
    featured: false,
    organic: false,
    proteinRich: false
  },
  {
    id: 's3',
    name: 'SHREE KHAND',
    category: 'sweets',
    price: 25,
    unit: '100GM',
    rating: 4.9,
    reviewsCount: 3120,
    image: paragShrikhandImg,
    description: 'Delectable strained yogurt sweet dessert blended with saffron, cardamoms, and charoli nuts. Smooth, velvety, and delightfully sweet.',
    benefits: ['Made from high quality fresh hung dahi', 'Traditional Maharashtrian & Gujarati style recipe', 'High-quality dairy fats and smooth creaminess', 'Sterile hermetically sealed cup packaging'],
    ingredients: ['Chakka (Strained Yogurt)', 'Sugar', 'Cardamom', 'Nutmeg', 'Saffron'],
    nutrition: {
      energy: '240 kcal',
      protein: '4.8 g',
      fat: '6.0 g',
      carbohydrates: '42.0 g',
      calcium: '120 mg'
    },
    storage: 'Keep refrigerated below 4°C.',
    available: true,
    bestSeller: true,
    featured: true,
    organic: false,
    proteinRich: false
  }
];

export const BLOGS: Blog[] = [
  {
    id: 'b1',
    title: 'The Wonders of Grass-Fed Cow Milk for Toddlers',
    excerpt: 'Grass-fed cow milk holds double the amount of vitamins and clean natural omega fats compared to grain-fed milk. Read why it is vital for development...',
    date: 'July 15, 2026',
    author: 'Dr. Shruti Sharma (Nutritionist)',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400',
    category: 'wellness',
    readTime: '3 min'
  },
  {
    id: 'b2',
    title: 'Understanding Bilona Churned Ghee and Its Ancient Benefits',
    excerpt: 'Deep-dive into the traditional Vedic Bilona method of churning butter from curd rather than malai, creating a golden potion for digestive fire...',
    date: 'June 28, 2026',
    author: 'Chef Ranveer K.',
    image: 'https://images.unsplash.com/photo-1622484211148-71649930c6a0?auto=format&fit=crop&q=80&w=400',
    category: 'recipes',
    readTime: '5 min'
  },
  {
    id: 'b3',
    title: 'Why Real Malai Paneer is the Best Protein Source for Vegetarians',
    excerpt: 'Malai paneer packs clean proteins along with slow-digesting fats. This keeps you full longer, helping in strength training and weight control...',
    date: 'May 14, 2026',
    author: 'Rohan Dev (Fitness Coach)',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400',
    category: 'dairy-science',
    readTime: '4 min'
  }
];

export const FAQS = [
  {
    q: 'How does the morning milk subscription work?',
    a: 'Subscriptions are delivered fresh to your doorstep every morning between 5:00 AM and 7:30 AM. You can set schedules (Daily, Alternate Days, Custom Days, etc.) and pause/skip deliveries at any time before 10:00 PM the previous night.'
  },
  {
    q: 'Are there any delivery charges for subscription deliveries?',
    a: 'Absolutely not! All daily or scheduled subscription deliveries of milk and other daily dairy essentials come with completely FREE delivery.'
  },
  {
    q: 'What is the benefit of organic A2 milk over standard toned milk?',
    a: 'Organic A2 milk contains only the A2 beta-casein protein (similar to human mother milk), which is far easier to digest. Regular toned milk might contain A1 proteins, which can cause bloating or digestive issues in milk-sensitive individuals. Also, our organic pasture farms ensure cows never receive hormones.'
  },
  {
    q: 'Can I pause my subscription when going on vacation?',
    a: 'Yes, easily! Just activate the "Vacation Mode" on our subscription builder or from your profile settings. Select your start and end dates, and all scheduled milk deliveries will be held automatically until you return.'
  },
  {
    q: 'What quality checks are done at Parag Milk?',
    a: 'Every single batch undergoes 24 rigorous automated checks including tests for urea, starch, detergent, water dilution, and antibiotic traces. We maintain cold-chain temperatures below 4°C right from raw collection to your doorstep.'
  }
];

export const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Anjali Deshmukh',
    role: 'Mother of two, Pune',
    comment: 'Parag Cow Milk has been a game changer for my family. My kids love the natural sweet taste and the morning delivery is incredibly consistent—always before 6:30 AM!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 't2',
    name: 'Vikram Malhotra',
    role: 'Fitness Athlete, Bengaluru',
    comment: 'The Pro-Fit shake is my go-to post-workout. 30g of pure protein without any artificial sugar. Also, the Malai Paneer is incredibly soft, nothing like standard store paneer!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 't3',
    name: 'Meenakshi Iyer',
    role: 'Home Chef, Chennai',
    comment: 'I prepare traditional sweets, and Parag Vedic Ghee adds an amazing granular texture and aroma that brings me back to my grandmother’s kitchen. Super premium!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
  }
];

export const COUPONS = [
  { code: 'PARAGNEW', discount: 15, minSpend: 199, description: 'Get 15% OFF on your first purchase above ₹199' },
  { code: 'FRESHDAIRY', discount: 10, minSpend: 99, description: 'Flat 10% OFF on all fresh milk & curd packs' },
  { code: 'SUPERSUB', discount: 20, minSpend: 499, description: 'Flat 20% OFF on subscribing for 30 days or more' }
];
