import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import ProductCard from '../components/common/ProductCard';
import './Home.css';
import { ChevronRight, Star, ShieldCheck, Truck, Headphones, Tag, Zap, TrendingUp, Gift } from 'lucide-react';


// --- Section Header ---
const SectionHeader = ({ icon, title, subtitle, linkTo, viewLabel }) => (
  <div className="section-head reveal">
    <div className="section-head-left">
      <span className="section-icon">{icon}</span>
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
    </div>
    {linkTo && <Link to={linkTo} className="section-view-all">{viewLabel || 'View All'} <ChevronRight size={15} /></Link>}
  </div>
);

// --- Page ---
const Home = () => {
  const [categories, setCategories] = useState([]);
  const [dbProducts, setDbProducts] = useState([]); // Will hold "For You" (recommended)
  const [bestsellers, setBestsellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { t } = useAppSettings();

  useEffect(() => {
    window.scrollTo(0, 0);

    Promise.all([
      publicAPI.getCategories().catch(() => ({ data: [] })),
      publicAPI.getTopProducts().catch(() => ({ data: [] })),
      publicAPI.getTopSellers().catch(() => ({ data: [] })),
      publicAPI.getNewArrivals().catch(() => ({ data: [] }))
    ]).then(([catsRes, recRes, sellersRes, newRes]) => {
      setCategories(catsRes.data || []);
      setDbProducts(recRes.data || []); // Recommended / For You
      setBestsellers(sellersRes.data || []);
      setNewArrivals(newRes.data || []);
    }).finally(() => setLoading(false));

    // Intersection Observer for Scroll Revelations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-page">

      {/* --- Hero --- */}
      <section className="hero-banner cinematic">
        <div className="hero-inner">
          <div className="hero-content reveal active">
            <span className="hero-badge"><Zap size={13} fill="currentColor" /> Premium Marketplace</span>
            <h1>{t('Discover')} <br /><span className="hero-accent">Efoy Gabeya.</span></h1>
            <p>{t('Your one-stop destination for high-quality electronics, fashion, and home essentials. Curated specifically for you.')}</p>
            <div className="hero-btns">
              <Link to="/shop" className="btn-solid-lg">{t('Explore Shop')} <ChevronRight size={18} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- Trust Bar --- */}
      <section className="trust-bar reveal">
        <div className="trust-inner">
          <div className="trust-item"><ShieldCheck size={20} /><span>{t('Secure Payments')}</span></div>
          <div className="trust-item"><Truck size={20} /><span>{t('Free Shipping')}</span></div>
          <div className="trust-item"><Headphones size={20} /><span>{t('Dedicated Support')}</span></div>
          <div className="trust-item"><Gift size={20} /><span>{t('Daily Deals')}</span></div>
        </div>
      </section>

      {/* --- Browse Categories --- */}
      <section className="home-section reveal">
        <div className="section-container">
          <SectionHeader icon={<Tag size={18} color="#2d6a4f" />} title={t('Shop by Category')} subtitle={t('Explore our handpicked collections.')} linkTo="/shop" viewLabel={t('View All')} />
          <div className="category-grid">
            {categories.slice(0, 6).map(cat => (
              <Link key={cat._id} to={`/shop?cat=${cat._id}`} className="category-card">
                <div className="cat-img-wrap">
                  <img src={cat.image} alt={cat.name} className="cat-image" />
                  <div className="cat-overlay">
                    <span className="cat-count">{t('Explore Items')}</span>
                  </div>
                </div>
                <div className="cat-info">
                  <span className="cat-name">{cat.name}</span>
                  <div className="cat-link">{t('Shop Now')} <ChevronRight size={14} /></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- Top Sellers --- */}
      <section className="home-section alt-bg reveal">
        <div className="section-container">
          <SectionHeader icon={<TrendingUp size={18} color="#2d6a4f" />} title={t('Bestsellers')} linkTo="/shop?sort=top" viewLabel={t('View All')} />
          <div className="products-grid cols-5">
            {bestsellers.slice(0, 5).map(p => <ProductCard key={p._id} product={p} addToCart={addToCart} />)}
          </div>
        </div>
      </section>

      {/* --- New Arrivals --- */}
      <section className="home-section reveal">
        <div className="section-container">
          <SectionHeader icon={<Zap size={18} color="#2d6a4f" fill="#2d6a4f" />} title={t('New Arrivals')} linkTo="/shop?sort=new" viewLabel={t('View All')} />
          <div className="products-grid cols-4">
            {newArrivals.slice(0, 4).map(p => <ProductCard key={p._id} product={p} addToCart={addToCart} />)}
          </div>
        </div>
      </section>
      
      {/* --- For You Recommendations --- */}
      <section className="home-section alt-bg reveal">
        <div className="section-container">
          <SectionHeader icon={<Star size={18} color="#2d6a4f" fill="#2d6a4f" />} title={t('For You')} subtitle={t('Personalized picks based on your activity.')} />
          <div className="products-grid cols-5" style={{marginTop: '1.5rem'}}>
             {[...dbProducts, ...bestsellers].sort(() => Math.random() - 0.5).slice(0, 10).map(p => (
               <ProductCard key={`${p._id}-${Math.random()}`} product={p} addToCart={addToCart} />
             ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
