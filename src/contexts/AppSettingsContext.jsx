import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AppSettingsContext = createContext(null);

const STORAGE_KEYS = {
  language: 'app_language',
  currency: 'app_currency',
  theme: 'app_theme',
  fxRates: 'app_fx_rates',
  fxUpdatedAt: 'app_fx_updated_at',
  translationCachePrefix: 'app_translation_cache_'
};

const FX_REFRESH_WINDOW_MS = 1000 * 60 * 60 * 6;

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic' },
  { code: 'om', label: 'Afan Oromo' }
];

const SUPPORTED_CURRENCIES = [
  { code: 'ETB', label: 'ETB' },
  { code: 'USD', label: 'USD' },
  { code: 'EUR', label: 'EUR' },
  { code: 'CNY', label: 'CNY' },
  { code: 'JPY', label: 'JPY' }
];

const FALLBACK_RATES = {
  ETB: 1,
  USD: 0.017,
  EUR: 0.016,
  CNY: 0.12,
  JPY: 2.6
};

const CURRENCY_LOCALES = {
  ETB: 'en-ET',
  USD: 'en-US',
  EUR: 'de-DE',
  CNY: 'zh-CN',
  JPY: 'ja-JP'
};

const TRANSLATIONS = {
  en: {
    home: 'Home',
    shop: 'Shop',
    about: 'About',
    contact: 'Contact',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    language: 'Language',
    currency: 'Currency',
    lightMode: 'Light',
    darkMode: 'Dark',
    quickLinks: 'Quick Links',
    customerCare: 'Customer Care',
    headquarters: 'Headquarters',
    searchProducts: 'Search products...',
    search: 'Search',
    notifications: 'Notifications',
    alerts: 'Alerts',
    noNotificationsYet: 'No notifications yet.',
    markAllRead: 'Mark all read',
    account: 'Account',
    myProfile: 'My Profile',
    cart: 'Cart',
    access: 'access',
    accountSignIn: 'Account / Sign In',
    storefront: 'Storefront',
    continueShopping: 'Continue Shopping',
    loading: 'Loading...',
    free: 'Free',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    total: 'Total',
    'Discover': 'Discover',
    'Explore Shop': 'Explore Shop',
    'View Arrivals': 'View Arrivals',
    'Your one-stop destination for high-quality electronics, fashion, and home essentials. Curated specifically for you.': 'Your one-stop destination for high-quality electronics, fashion, and home essentials. Curated specifically for you.',
    'Secure Payments': 'Secure Payments',
    'Free Shipping': 'Free Shipping',
    'Dedicated Support': 'Dedicated Support',
    'Daily Deals': 'Daily Deals',
    'Shop by Category': 'Shop by Category',
    'Explore our handpicked collections.': 'Explore our handpicked collections.',
    'Explore Items': 'Explore Items',
    'Shop Now': 'Shop Now',
    'Bestsellers': 'Bestsellers',
    'View All': 'View All',
    'New Arrivals': 'New Arrivals',
    'For You': 'For You',
    'Personalized picks based on your activity.': 'Personalized picks based on your activity.',
    'Sold out': 'Sold out',
    'Add to Cart': 'Add to Cart',
    'Only {count} left': 'Only {count} left',
    '{count} in stock': '{count} in stock',
    'Free Ship': 'Free Shipping',
    '{count} sold': '{count} sold',
    'In Stock': 'In Stock',
    'Out of Stock': 'Out of Stock',
    'Availability': 'Availability',
    'Rating': 'Rating',
    'review': 'review',
    'reviews': 'reviews',
    'Category': 'Category',
    'Sizes': 'Sizes',
    'Colors': 'Colors',
    'Units sold': 'Units sold',
    'Specification': 'Specification',
    'Back to Shop': 'Back to Shop',
    'Buy Now': 'Buy Now',
    'Related Items': 'Related Items',
    'Customer Reviews': 'Customer Reviews',
    'Write a review': 'Write a review',
    'Your rating': 'Your rating',
    'Post Review': 'Post Review',
    'Verified purchase': 'Verified purchase',
    'No reviews yet': 'No reviews yet',
    'Shopping Cart': 'Shopping Cart',
    'Review your bag': 'Review your bag',
    'Some selected items are out of stock or exceed the current stock limit. Please adjust quantities before checkout.': 'Some selected items are out of stock or exceed the current stock limit. Please adjust quantities before checkout.',
    'Select all': 'Select all',
    '{count} selected': '{count} selected',
    'Remove selected': 'Remove selected',
    'Clear cart': 'Clear cart',
    'Size': 'Size',
    'Color': 'Color',
    'each': 'each',
    'Order Summary': 'Order Summary',
    'Only selected items move to checkout.': 'Only selected items move to checkout.',
    'Selected items': 'Selected items',
    'Taxes': 'Taxes',
    'Calculated at checkout': 'Calculated at checkout',
    'Secure Checkout': 'Secure Checkout',
    'Continue shopping': 'Continue shopping',
    'Secure payment': 'Secure payment',
    'Tracked shipping': 'Tracked shipping',
    'Protected checkout': 'Protected checkout',
    'Your cart is empty': 'Your cart is empty',
    'Add products to your bag to review them here and continue to checkout.': 'Add products to your bag to review them here and continue to checkout.',
    '{count} items': '{count} items',
    '{count} products': '{count} products',
    'Send us a message': 'Send us a message',
    'Full Name': 'Full Name',
    'Enter your name': 'Enter your name',
    'Email Address': 'Email Address',
    'Enter your email': 'Enter your email',
    'Message': 'Message',
    'How can we help?': 'How can we help?',
    'Send Message': 'Send Message',
    'Thank you for your message. We will get back to you soon.': 'Thank you for your message. We will get back to you soon.',
    'Highlights': 'Highlights',
    'Membership Status': 'Membership Status',
    'Verified Member': 'Verified Member',
    'Administrator': 'Administrator',
    'Primary Delivery': 'Primary Delivery',
    'Tracking Alerts': 'Tracking Alerts',
    'ALL PRODUCTS': 'ALL PRODUCTS'
  },
  am: {
    home: 'ዋና ገጽ',
    shop: 'ሱቅ',
    about: 'ስለ እኛ',
    contact: 'እውቂያ',
    signIn: 'ይግቡ',
    signOut: 'ይውጡ',
    signUp: 'ይመዝገቡ',
    language: 'ቋንቋ',
    currency: 'ምንዛሬ',
    lightMode: 'ብርሃን',
    darkMode: 'ጨለማ',
    quickLinks: 'ፈጣን ሊንኮች',
    customerCare: 'የደንበኞች አገልግሎት',
    headquarters: 'ዋና መስሪያ ቤት',
    searchProducts: 'ምርቶችን ይፈልጉ...',
    search: 'ፈልግ',
    notifications: 'ማሳወቂያዎች',
    alerts: 'ማንቂያዎች',
    noNotificationsYet: 'ምንም ማሳወቂያ የለም',
    markAllRead: 'ሁሉንም ተነቧል በል',
    account: 'መለያ',
    myProfile: 'መገለጫዬ',
    cart: 'ጋሪ',
    access: 'መዳረሻ',
    accountSignIn: 'መለያ / ይግቡ',
    storefront: 'መደብር',
    continueShopping: 'ግዢዎን ይቀጥሉ',
    loading: 'በመጫን ላይ...',
    free: 'ነፃ',
    subtotal: 'ንዑስ ድምር',
    shipping: 'ማጓጓዣ',
    total: 'ጠቅላላ',
    'Discover': 'ይመርምሩ',
    'Explore Shop': 'ሱቁን ይቃኙ',
    'View Arrivals': 'አዳዲስ ምርቶችን ይመልከቱ',
    'Your one-stop destination for high-quality electronics, fashion, and home essentials. Curated specifically for you.': 'ለእርስዎ ተብለው የተመረጡ ጥራት ያላቸው ኤሌክትሮኒክስ፣ ፋሽን እና የቤት እቃዎችን በአንድ ቦታ ያግኙ።',
    'Secure Payments': 'ደህንነቱ የተጠበቀ ክፍያ',
    'Free Shipping': 'ነፃ ማጓጓዣ',
    'Dedicated Support': 'የወሰነ ድጋፍ',
    'Daily Deals': 'የቀን ቅናሾች',
    'Shop by Category': 'በምድብ ይግዙ',
    'Explore our handpicked collections.': 'በጥንቃቄ የተመረጡ ስብስቦቻችንን ያስሱ።',
    'Explore Items': 'እቃዎችን ይቃኙ',
    'Shop Now': 'አሁን ይግዙ',
    'Bestsellers': 'ምርጥ ሽያጭ',
    'View All': 'ሁሉንም ይመልከቱ',
    'New Arrivals': 'አዳዲስ ምርቶች',
    'For You': 'ለእርስዎ',
    'Personalized picks based on your activity.': 'በእንቅስቃሴዎ ላይ የተመሰረቱ ምርጫዎች',
    'Sold out': 'ተሽጦ አልቋል',
    'Add to Cart': 'ወደ ጋሪ ጨምር',
    'Only {count} left': 'የቀረው {count} ብቻ',
    '{count} in stock': '{count} በክምችት ላይ',
    'Free Ship': 'ነፃ ማጓጓዣ',
    '{count} sold': '{count} ተሽጧል',
    'In Stock': 'በክምችት ላይ',
    'Out of Stock': 'ያለቀ',
    'Availability': 'ተገኝነት',
    'Rating': 'ደረጃ',
    'review': 'አስተያየት',
    'reviews': 'አስተያየቶች',
    'Category': 'ምድብ',
    'Sizes': 'መጠኖች',
    'Colors': 'ቀለሞች',
    'Units sold': 'የተሸጡ እቃዎች',
    'Specification': 'ዝርዝር መግለጫ',
    'Back to Shop': 'ወደ ሱቅ ይመለሱ',
    'Buy Now': 'አሁን ይግዙ',
    'Related Items': 'ተዛማጅ እቃዎች',
    'Customer Reviews': 'የደንበኛ አስተያየቶች',
    'Write a review': 'አስተያየት ይጻፉ',
    'Your rating': 'የእርስዎ ደረጃ',
    'Post Review': 'አስተያየትን ይለጥፉ',
    'Verified purchase': 'የተረጋገጠ ግዢ',
    'No reviews yet': 'ገና አስተያየት አልተሰጠም',
    'Shopping Cart': 'የገበያ ጋሪ',
    'Review your bag': 'ጋሪዎን ይከልሱ',
    'Some selected items are out of stock or exceed the current stock limit. Please adjust quantities before checkout.': 'አንዳንድ የተመረጡ እቃዎች በክምችት ላይ የሉም ወይም ከገደቡ በላይ ናቸው። እባክዎ ከመክፈልዎ በፊት መጠኑን ያስተካክሉ።',
    'Select all': 'ሁሉንም ምረጥ',
    '{count} selected': '{count} ተመርጠዋል',
    'Remove selected': 'የተመረጡትን አስወግድ',
    'Clear cart': 'ጋሪን ባዶ አድርግ',
    'Size': 'መጠን',
    'Color': 'ቀለም',
    'each': 'እያንዳንዱ',
    'Order Summary': 'የትዕዛዝ ማጠቃለያ',
    'Only selected items move to checkout.': 'የተመረጡ እቃዎች ብቻ ወደ ክፍያ ይሄዳሉ።',
    'Selected items': 'የተመረጡ እቃዎች',
    'Taxes': 'ታክሶች',
    'Calculated at checkout': 'ክፍያ ሲፈጽሙ የሚሰላ',
    'Secure Checkout': 'ደህንነቱ የተጠበቀ ክፍያ',
    'Continue shopping': 'ግዢዎን ይቀጥሉ',
    'Secure payment': 'ደህንነቱ የተጠበቀ ክፍያ',
    'Tracked shipping': 'ክትትል የሚደረግበት ማጓጓዣ',
    'Protected checkout': 'የተጠበቀ ክፍያ',
    'Your cart is empty': 'ጋሪዎ ባዶ ነው',
    'Add products to your bag to review them here and continue to checkout.': 'እቃዎችን እዚህ ለመገምገም እና ወደ ክፍያ ለመቀጠል ወደ ጋሪዎ ይጨምሩ።',
    '{count} items': '{count} እቃዎች',
    '{count} products': '{count} ምርቶች',
    'Send us a message': 'መልእክት ይላኩልን',
    'Full Name': 'ሙሉ ስም',
    'Enter your name': 'ስምዎን ያስገቡ',
    'Email Address': 'የኢሜል አድራሻ',
    'Enter your email': 'ኢሜልዎን ያስገቡ',
    'Message': 'መልእክት',
    'How can we help?': 'እንዴት ልንረዳዎ እንችላለን?',
    'Send Message': 'መልእክት ይላኩ',
    'Thank you for your message. We will get back to you soon.': 'ስለ መልእክትዎ እናመሰግናለን። በቅርቡ እናገኝዎታለን።',
    'Highlights': 'ዋና ዋና ነጥቦች',
    'Membership Status': 'የአባልነት ሁኔታ',
    'Verified Member': 'የተረጋገጠ አባል',
    'Administrator': 'አስተዳዳሪ',
    'Primary Delivery': 'ዋና የማድረሻ ቦታ',
    'Tracking Alerts': 'የክትትል ማሳወቂያዎች',
    'ALL PRODUCTS': 'ሁሉንም ምርቶች'
  },
  om: {
    home: 'Mana',
    shop: 'Daldala',
    about: 'Waa ee Nuyi',
    contact: 'Nu Qunnamaa',
    signIn: 'Seeni',
    signOut: 'Ba i',
    signUp: 'Galmaa i',
    language: 'Afaan',
    currency: 'Maallaqa',
    lightMode: 'Ifaa',
    darkMode: 'Dukkanaa',
    quickLinks: 'Geessitoota Saffisaa',
    customerCare: 'Tajaajila Maamila',
    headquarters: 'Waajjira Guddaa',
    searchProducts: 'Meeshaalee barbaadi...',
    search: 'Barbaadi',
    notifications: 'Beeksisa',
    alerts: 'Akeekkachiisa',
    noNotificationsYet: 'Beeksisa hin jiru',
    markAllRead: 'Hunda dubbifame godhi',
    account: 'Herrega',
    myProfile: 'Piroofayilii kiyya',
    cart: 'Gaarii',
    access: 'Senuu',
    accountSignIn: 'Herrega / Seeni',
    storefront: 'Fuula Daldalaa',
    continueShopping: 'Daldala itti fufi',
    loading: 'Fe’amaa jira...',
    free: 'Bilisa',
    subtotal: 'Ida’ama Xiqqaa',
    shipping: 'Fe’umsa',
    total: 'Ida’ama Waliigalaa',
    'Discover': 'Barbaadi',
    'Explore Shop': 'Daldala qoradhu',
    'View Arrivals': 'Haaraa dhufan ilaali',
    'Your one-stop destination for high-quality electronics, fashion, and home essentials. Curated specifically for you.': 'Bakka tokkotti meeshaalee elektirooniksii, faashinii fi meeshaalee manaa qulqullina qaban kan isiniif dhiyaatan argattu.',
    'Secure Payments': 'Kaffaltii amansiisaa',
    'Free Shipping': 'Fe’umsa bilisaa',
    'Dedicated Support': 'Deeggarsa addaa',
    'Daily Deals': 'Gurgurtaa guyyaa',
    'Shop by Category': 'Ramaddiin bitali',
    'Explore our handpicked collections.': 'Sassaabbiiwwan keenya filataman qoradhu.',
    'Explore Items': 'Meeshaalee qoradhu',
    'Shop Now': 'Amma bitali',
    'Bestsellers': 'Gurgurtaa guddaa',
    'View All': 'Hunda ilaali',
    'New Arrivals': 'Meeshaalee haaraa',
    'For You': 'Siif',
    'Personalized picks based on your activity.': 'Filiinsa kee irratti hunda’uun',
    'Sold out': 'Dhumateera',
    'Add to Cart': 'Gara gaariitti dabali',
    'Only {count} left': '{count} qofatu hafe',
    '{count} in stock': '{count} mana keessa jira',
    'Free Ship': 'Fe’umsa bilisaa',
    '{count} sold': '{count} gurgurame',
    'In Stock': 'Mana keessa jira',
    'Out of Stock': 'Dhumateera',
    'Availability': 'Argamuu isaa',
    'Rating': 'Sadarkaa',
    'review': 'Yaada',
    'reviews': 'Yaadota',
    'Category': 'Ramaddii',
    'Sizes': 'Hamma',
    'Colors': 'Bifoota',
    'Units sold': 'Kunuunsa gurgurame',
    'Specification': 'Ibsa meeshaa',
    'Back to Shop': 'Gara daldalaatti deebi’i',
    'Buy Now': 'Amma bitali',
    'Related Items': 'Meeshaalee wal-fakkatan',
    'Customer Reviews': 'Yaada maamilaa',
    'Write a review': 'Yaada kee barreessi',
    'Your rating': 'Sadarkaa ati kennitu',
    'Post Review': 'Yaada kee maxxansi',
    'Verified purchase': 'Bittaa mirkanaa’e',
    'No reviews yet': 'Yaanni amma dura kenname hin jiru',
    'Shopping Cart': 'Gaarii daldalaa',
    'Review your bag': 'Gaarii kee killaasuu',
    'Some selected items are out of stock or exceed the current stock limit. Please adjust quantities before checkout.': 'Meeshaaleen tokko tokko mana keessa hin jiran ykn hamma barbaadame oli. Maaloo kaffaltii dura hamma isaa sirreessi.',
    'Select all': 'Hunda filadhu',
    '{count} selected': '{count} filatameera',
    'Remove selected': 'Kan filataman balleessi',
    'Clear cart': 'Gaarii qulqulleessi',
    'Size': 'Hamma',
    'Color': 'Bifa',
    'each': 'tokko tokkoon',
    'Order Summary': 'Cuunfa ajajaa',
    'Only selected items move to checkout.': 'Meeshaalee filataman qofatu gara kaffaltiitti darba.',
    'Selected items': 'Meeshaalee filataman',
    'Taxes': 'Taaksii',
    'Calculated at checkout': 'Kaffaltii irratti kan shallagamu',
    'Secure Checkout': 'Kaffaltii amansiisaa',
    'Continue shopping': 'Daldala itti fufi',
    'Secure payment': 'Kaffaltii amansiisaa',
    'Tracked shipping': 'Fe’umsa hordofamu',
    'Protected checkout': 'Kaffaltii eegumsa qabu',
    'Your cart is empty': 'Gaariin kee duwwaadha',
    'Add products to your bag to review them here and continue to checkout.': 'Meeshaalee asirratti deebitee ilaaluufi gara kaffaltiitti darbuuf gara gaariitti dabali.',
    '{count} items': '{count} meeshaalee',
    '{count} products': '{count} oomishoota',
    'Send us a message': 'Ergaa nuuf ergi',
    'Full Name': 'Maqaa Guutuu',
    'Enter your name': 'Maqaa kee galchi',
    'Email Address': 'Teessoo Imeelii',
    'Enter your email': 'Imeelii kee galchi',
    'Message': 'Ergaa',
    'How can we help?': 'Akkamitti si gargaaruu dandeenya?',
    'Send Message': 'Ergaa Ergi',
    'Thank you for your message. We will get back to you soon.': 'Ergaa keetiif galatoomi. Dhiyootti si qunnamna.',
    'Highlights': 'Qabxiiwwan guguddoo',
    'Membership Status': 'Haala Miseensummaa',
    'Verified Member': 'Miseensa Mirkanaa’e',
    'Administrator': 'Bulchaa',
    'Primary Delivery': 'Bakka Geessitoota Jalqabaa',
    'Tracking Alerts': 'Beeksisa Hordoffii',
    'ALL PRODUCTS': 'OOMISHOOTA HUNDA'
  }
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pickRates = (rawRates) => {
  if (!rawRates || typeof rawRates !== 'object') return FALLBACK_RATES;

  const picked = { ETB: 1 };
  SUPPORTED_CURRENCIES.forEach(({ code }) => {
    if (code === 'ETB') return;
    const rate = toNumber(rawRates[code]);
    picked[code] = rate > 0 ? rate : FALLBACK_RATES[code];
  });

  return picked;
};

const getCachedRates = () => {
  try {
    const rawRates = localStorage.getItem(STORAGE_KEYS.fxRates);
    const rawUpdatedAt = localStorage.getItem(STORAGE_KEYS.fxUpdatedAt);
    if (!rawRates || !rawUpdatedAt) return null;

    const parsedRates = JSON.parse(rawRates);
    const updatedAt = Number(rawUpdatedAt);
    if (!updatedAt || Date.now() - updatedAt > FX_REFRESH_WINDOW_MS) return null;

    return pickRates(parsedRates);
  } catch {
    return null;
  }
};

export const AppSettingsProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEYS.language) || 'en');
  const [currency, setCurrency] = useState(() => localStorage.getItem(STORAGE_KEYS.currency) || 'ETB');
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.theme) || 'light');
  const [rates, setRates] = useState(() => getCachedRates() || FALLBACK_RATES);
  const [dynamicTranslations, setDynamicTranslations] = useState({});
  const pendingTranslationRequests = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    const loadRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/ETB');
        const payload = await response.json();
        const nextRates = pickRates(payload?.rates);
        if (cancelled) return;

        setRates(nextRates);
        localStorage.setItem(STORAGE_KEYS.fxRates, JSON.stringify(nextRates));
        localStorage.setItem(STORAGE_KEYS.fxUpdatedAt, String(Date.now()));
      } catch {
        // Keep fallback/cached rates if live market rates are unavailable.
      }
    };

    loadRates();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.language, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    try {
      const cacheKey = `${STORAGE_KEYS.translationCachePrefix}${language}`;
      const raw = localStorage.getItem(cacheKey);
      setDynamicTranslations(raw ? JSON.parse(raw) : {});
    } catch {
      setDynamicTranslations({});
    }
  }, [language]);

  useEffect(() => {
    try {
      const cacheKey = `${STORAGE_KEYS.translationCachePrefix}${language}`;
      localStorage.setItem(cacheKey, JSON.stringify(dynamicTranslations));
    } catch {
      // Ignore cache persistence failures.
    }
  }, [language, dynamicTranslations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currency, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const queueDynamicTranslation = useCallback((text, langCode) => {
    if (!text || langCode === 'en') return;

    const requestKey = `${langCode}:${text}`;
    if (pendingTranslationRequests.current.has(requestKey)) return;
    pendingTranslationRequests.current.add(requestKey);

    window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langCode}`
        );
        const payload = await response.json();
        const translatedText = String(payload?.responseData?.translatedText || '').trim();

        if (!translatedText || translatedText.toLowerCase() === text.toLowerCase()) return;

        setDynamicTranslations((prev) => {
          if (prev[text]) return prev;
          return { ...prev, [text]: translatedText };
        });
      } catch {
        // Keep fallback text if dynamic translation fails.
      } finally {
        pendingTranslationRequests.current.delete(requestKey);
      }
    }, 0);
  }, []);

  const t = useCallback((key, replacements) => {
    const staticTemplate = TRANSLATIONS[language]?.[key];
    const dynamicTemplate = dynamicTranslations[key];
    const englishTemplate = TRANSLATIONS.en[key];
    const template = staticTemplate ?? dynamicTemplate ?? englishTemplate ?? key;

    if (!staticTemplate && !dynamicTemplate && language !== 'en') {
      queueDynamicTranslation(String(key), language);
    }

    if (!replacements || typeof replacements !== 'object') return template;

    return Object.entries(replacements).reduce(
      (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
      template
    );
  }, [language, dynamicTranslations, queueDynamicTranslation]);

  const formatPrice = useCallback((value) => {
    const amount = toNumber(value);
    const conversionRate = toNumber(rates[currency]) || 1;
    const converted = amount * conversionRate;

    return new Intl.NumberFormat(CURRENCY_LOCALES[currency] || 'en-US', {
      style: 'currency',
      currency
    }).format(converted);
  }, [currency, rates]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currency,
      setCurrency,
      theme,
      setTheme,
      toggleTheme,
      formatPrice,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
      supportedCurrencies: SUPPORTED_CURRENCIES
    }),
    [language, currency, theme, toggleTheme, formatPrice, t]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};
