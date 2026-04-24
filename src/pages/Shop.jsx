import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import ProductCard from '../components/common/ProductCard';
import './Shop.css';
import { 
  ListFilter, 
  Search, 
  ChevronRight, 
  SlidersHorizontal, 
  ArrowUpDown,
  LayoutGrid,


  Smartphone,
  Tag
} from 'lucide-react';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');
  const { addToCart } = useCart();
  const { t } = useAppSettings();

  const currentCat = searchParams.get('cat') || 'all';
  const currentSearch = searchParams.get('search') || '';
  
  // Track expanded parent categories
  const [expandedCats, setExpandedCats] = useState([currentCat]);

  useEffect(() => {
    publicAPI.getCategories()
      .then(r => setCategories(r.data || []))
      .catch(err => console.error("Error loading categories", err));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProducts();
    
    // Auto-expand if the current category is a child of something
    const parent = categories.find(p => p.children?.some(c => c._id === currentCat));
    if (parent && !expandedCats.includes(parent._id)) {
      setExpandedCats(prev => [...prev, parent._id]);
    }
  }, [currentCat, currentSearch, sortOrder, categories]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentCat !== 'all') params.append('category', currentCat);
      if (currentSearch) params.append('search', currentSearch);
      params.append('limit', '100');
      if (sortOrder) params.append('sort', sortOrder);

      const response = await publicAPI.getAllProducts(params.toString());
      setProducts(response.data || []);
    } catch (error) {
      console.error("Shop Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (catId) => {
    setExpandedCats(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const setCategory = (catId, isParentWithChildren) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('cat');
      newParams.delete('search');
    } else {
      newParams.set('cat', catId);
    }
    setSearchParams(newParams);
    
    if (isParentWithChildren) {
      toggleExpand(catId);
    }
  };

  return (
    <div className="shop-page">
      {/* Header / Hero */}
      <header className="shop-header">
        <div className="container">
          <div className="shop-header-content">
            <h1 className="shop-title">{t('Shop Collection')}</h1>
            <p className="shop-subtitle">{t('Find exactly what you are looking for.')}</p>
          </div>
        </div>
      </header>

      <div className="container shop-container">
        {/* Sidebar Filters */}
        <aside className="shop-sidebar">
          <div className="sidebar-block">
            <h3 className="sidebar-title"><ListFilter size={16} /> {t('Categories')}</h3>
            <div className="cat-list">
              {/* ALL PRODUCTS */}
              <button
                className={`cat-item ${currentCat === 'all' ? 'active' : ''}`}
                onClick={() => setCategory('all', false)}
              >
                <div className="cat-item-left">
                  <span className="cat-item-icon"><LayoutGrid size={18} /></span>
                  <span className="cat-item-label">
                    {t('ALL PRODUCTS')} 
                    <span className="cat-count-badge">({categories.reduce((acc, c) => acc + (c.count || 0), 0)})</span>
                  </span>
                </div>
              </button>

              {categories.map(cat => {
                const isExpanded = expandedCats.includes(cat._id);
                const hasChildren = cat.children && cat.children.length > 0;
                const isActive = currentCat === cat._id;

                return (
                  <React.Fragment key={cat._id}>
                    <button
                      className={`cat-item ${isActive ? 'active' : ''}`}
                      onClick={() => setCategory(cat._id, hasChildren)}
                    >
                      <div className="cat-item-left">
                        <span className="cat-item-icon"><Tag size={18} /></span>
                        <span className="cat-item-label">
                          {cat.name}
                          <span className="cat-count-badge">({cat.count || 0})</span>
                        </span>
                      </div>
                      {hasChildren && (
                        <ChevronRight 
                          size={14} 
                          className={`cat-item-arrow ${isExpanded ? 'rotated' : ''}`} 
                        />
                      )}
                    </button>
                    
                    {hasChildren && isExpanded && (
                      <div className="cat-sub-list">
                        {cat.children.map(child => (
                          <button
                            key={child._id}
                            className={`cat-sub-item ${currentCat === child._id ? 'active' : ''}`}
                            onClick={() => setCategory(child._id, false)}
                          >
                            <span className="sub-cat-label">{child.name}</span>
                            <span className="sub-cat-count">({child.count || 0})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="shop-main">
          {/* Toolbar */}
          <div className="shop-toolbar">
            <div className="toolbar-left">
              <span className="results-count">{t('Showing {count} products', { count: products.length })}</span>
            </div>
            
            <div className="toolbar-right">
              <div className="sort-box">
                <ArrowUpDown size={16} />
                <select 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="sort-select"
                >
                  <option value="newest">{t('Newest First')}</option>
                  <option value="price-low">{t('Price: Low to High')}</option>
                  <option value="price-high">{t('Price: High to Low')}</option>
                  <option value="trending">{t('Trending')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="shop-grid">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="shop-skeleton" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="shop-grid">
              {products.map(product => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  addToCart={addToCart}
                  onImageError={() => {
                    setProducts(prev => prev.filter(p => p._id !== product._id));
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="shop-empty">
              <span className="empty-icon">🍃</span>
              <h3>{t('No products found')}</h3>
              <p>{t('Try adjusting your search or category filters.')}</p>
              <button 
                className="btn-clear"
                onClick={() => {
                  setSearchParams({});
                  setSortOrder('newest');
                }}
              >
                {t('Clear all filters')}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
