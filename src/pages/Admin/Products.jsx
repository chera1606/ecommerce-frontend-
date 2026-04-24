import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI, publicAPI } from '../../services/api';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import AdminModal from '../../components/admin/AdminModal';
import { 
  Plus, Search, Filter, Edit3, Trash2, Loader2, 
  Tag, Hash, DollarSign, Box, Upload, Link, 
  Layers, ChevronLeft, ChevronRight, AlertTriangle,
  Info, Globe
} from 'lucide-react';
import './AdminProducts.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [flatCategories, setFlatCategories] = useState([]);
  
  // Image Handlers
  const [imageMode, setImageMode] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const { formatPrice, t } = useAppSettings();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    classification: 'CLOTHING',
    category: '',
    unitPrice: '',
    inventoryLevel: '',
    imageUrl: '',
    specs: ''
  });

  const fetchProducts = useCallback(async (query = '', page = 1, stockStat = stockStatus) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (stockStat) params.append('stockStatus', stockStat);
      params.append('page', page);
      
      const res = await adminAPI.getAdminProducts(params.toString());
      if (res.success) {
        setProducts(res.data || []);
        setPagination({ page: res.page, totalPages: res.totalPages });
      }
    } catch (err) {
      console.error("Products fetch error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [stockStatus]);

  const fetchCategories = async () => {
    try {
      const res = await publicAPI.getCategories();
      if (res.success) {
        const flattened = [];
        const flatten = (items, level = 0) => {
          items.forEach(cat => {
            flattened.push({ ...cat, level });
            if (cat.children?.length > 0) flatten(cat.children, level + 1);
          });
        };
        flatten(res.data);
        setFlatCategories(flattened);
      }
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  };

  useEffect(() => {
    fetchProducts(searchQuery, 1, stockStatus);
    fetchCategories();
  }, [fetchProducts]);

  // Debounced search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchQuery, 1, stockStatus);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, stockStatus, fetchProducts]);

  const resetForm = () => {
    setFormData({
      name: '', sku: '', classification: 'CLOTHING',
      category: '', unitPrice: '', inventoryLevel: '',
      imageUrl: '', specs: ''
    });
    setSelectedProduct(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setImageMode('upload');
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setSelectedProduct(item);
    setFormData({
      name: item.product?.name || '',
      sku: item.sku || '',
      classification: item.classification || 'CLOTHING',
      category: item.category?._id || item.category || '',
      unitPrice: item.unitPrice || '',
      inventoryLevel: item.inventoryLevel || '',
      imageUrl: item.product?.thumbnail || '',
      specs: item.specs || ''
    });
    setPreviewUrl(item.product?.thumbnail || '');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageMode('upload');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'imageUrl' && imageMode === 'url') setPreviewUrl(value);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '') data.append(key, formData[key]);
    });

    if (imageMode === 'upload' && selectedFile) {
      data.append('image', selectedFile);
    }

    try {
      if (modalMode === 'add') {
        await adminAPI.createProduct(data);
      } else {
        await adminAPI.updateProduct(selectedProduct.internalId || selectedProduct._id, data);
      }
      await fetchProducts(searchQuery, pagination.page);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (displayId, mongoId) => {
    if (!window.confirm(`Verify Permanent Removal: Asset ID ${displayId}?`)) return;
    setDeletingId(displayId);
    try {
      await adminAPI.deleteProduct(mongoId || displayId);
      setProducts(prev => prev.filter(p => p.id !== displayId));
    } catch (err) {
      alert(err.message || "Deletion sequence interrupted");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="admin-loader-container">
        <Loader2 className="animate-spin text-forrest-green" size={40} style={{ color: 'var(--admin-primary)' }} />
        <p className="loader-text" style={{ fontWeight: 700, marginTop: '20px', color: 'var(--admin-text-muted)' }}>
          {t('loadingProducts')}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-products animate-fade-in">
      {/* Dynamic Header */}
      <div className="products-header">
        <div className="header-titles">
          <h2>Products</h2>
          <p>{t('Manage your product catalog and inventory.')}</p>
        </div>
        <button className="btn-emerald" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>{t('New Product')}</span>
        </button>
      </div>

      {/* Control Surface */}
      <div className="products-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={t('searchProducts')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="filter-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
          <label htmlFor="stockStatus" style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', fontWeight: '500' }}>{t('Status')}:</label>
          <select 
            id="stockStatus" 
            value={stockStatus} 
            onChange={(e) => setStockStatus(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--admin-text)', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">{t('All Statuses')}</option>
            <option value="IN_STOCK">{t('In Stock')}</option>
            <option value="LOW_STOCK">{t('Low Stock')}</option>
            <option value="OUT_OF_STOCK">{t('Out of Stock')}</option>
          </select>
        </div>
      </div>

      {/* Data Presentation Layer */}
      <div className="products-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('Product')}</th>
                <th>{t('SKU')}</th>
                <th>{t('Category')}</th>
                <th>{t('Price')}</th>
                <th>{t('Stock')}</th>
                <th>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="product-info-cell">
                      <div className="p-img">
                        <img src={item.product?.thumbnail || 'https://via.placeholder.com/200'} alt={item.product?.name} />
                      </div>
                      <div className="p-text">
                        <span className="p-name">{item.product?.name}</span>
                        <span className="p-id">{item.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="sku-cell">{item.sku}</td>
                  <td>
                    <span className="cat-badge">{item.classification}</span>
                  </td>
                  <td className="price-cell">
                    {formatPrice(item.unitPrice || 0)}
                  </td>
                  <td>
                    <div className="stock-cell">
                      <span className={`stock-count ${item.inventoryLevel < 10 ? 'low' : ''}`}>
                        {t('{count} units available', { count: item.inventoryLevel })}
                      </span>
                      <div className="stock-bar">
                        <div 
                          className="stock-fill" 
                          style={{ 
                            width: `${Math.min(item.inventoryLevel, 100)}%`, 
                            background: item.inventoryLevel < 10 ? '#dc2626' : 'var(--admin-primary)' 
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="act-btn edit" onClick={() => handleOpenEdit(item)}>
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className={`act-btn delete ${deletingId === item.id ? 'loading' : ''}`}
                        onClick={() => handleDelete(item.id, item.internalId)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '5rem', color: 'var(--admin-text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                      <Box size={48} opacity={0.2} />
                      <p style={{ fontWeight: 700 }}>{t('No products found.')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination View */}
      {pagination.totalPages > 1 && (
        <div className="pagination-surface" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', alignItems: 'center' }}>
          <button 
            className="tool-btn" 
            disabled={pagination.page === 1}
            onClick={() => fetchProducts(searchQuery, pagination.page - 1)}
          >
            <ChevronLeft size={16} /> {t('Previous')}
          </button>
          <span className="pag-indicator" style={{ fontWeight: 800, fontSize: '0.9rem' }}>
            {t('Page')} {pagination.page} / {pagination.totalPages}
          </span>
          <button 
            className="tool-btn" 
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchProducts(searchQuery, pagination.page + 1)}
          >
            {t('Next')} <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Asset Management Suite (Modal) */}
      <AdminModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="product-mgmt-modal"
        title={modalMode === 'add' ? t('New Product') : t('Edit Product')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>{t('Cancel')}</button>
            <button className="btn-emerald" onClick={handleSave} disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : t('Save Product')}
            </button>
          </>
        }
      >
        <div className="product-form-layout">
          <div className="form-main">
            <div className="form-section">
              <div className="form-group">
                <label><Tag size={14} /> Product Designation</label>
                <input 
                  type="text" name="name" 
                  placeholder="e.g. Apex High-Performance Trail Runner" 
                  value={formData.name} onChange={handleInputChange} required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><Hash size={14} /> System SKU / Serial</label>
                  <input type="text" name="sku" placeholder="Auto-generated if null" value={formData.sku} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label><Layers size={14} /> Database Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required>
                    <option value="">Select Category</option>
                    {flatCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {'\u00A0'.repeat(cat.level * 4)}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label><DollarSign size={14} /> Market Price</label>
                  <input type="number" step="0.01" name="unitPrice" placeholder="0.00" value={formData.unitPrice} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label><Box size={14} /> Current Inventory</label>
                  <input type="number" name="inventoryLevel" placeholder="100" value={formData.inventoryLevel} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label><Info size={14} /> Technical Profile</label>
                <textarea 
                  name="specs" 
                  placeholder="Elaborate on hardware architecture, material composition, or sizing guides..." 
                  value={formData.specs} onChange={handleInputChange} rows={3}
                />
              </div>
            </div>
          </div>

          <div className="form-sidebar">
            <label><Upload size={14} /> Asset Visual Metadata</label>
            <div className="image-preview-zone">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" />
              ) : (
                <div className="placeholder">
                  <Upload size={40} strokeWidth={1} />
                  <p>Drop or Upload Media</p>
                </div>
              )}
            </div>
            <div className="mode-toggle" style={{ marginBottom: '1.25rem', display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className={`tool-btn ${imageMode === 'upload' ? 'active' : ''}`} 
                onClick={() => setImageMode('upload')}
                style={{ flex: 1 }}
              >
                Local
              </button>
              <button 
                type="button" 
                className={`tool-btn ${imageMode === 'url' ? 'active' : ''}`} 
                onClick={() => setImageMode('url')}
                style={{ flex: 1 }}
              >
                Remote
              </button>
            </div>
            {imageMode === 'upload' ? (
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: '0.75rem', width: '100%', color: 'var(--admin-text-muted)' }} />
            ) : (
              <input 
                type="text" 
                name="imageUrl" 
                placeholder="Secure Asset Link (HTTPS)" 
                value={formData.imageUrl} 
                onChange={handleInputChange} 
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            )}
            <p style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', marginTop: '15px', fontStyle: 'italic', lineHeight: 1.4 }}>
              * High resolution PNG/JPG recommended for optimal storefront presentation.
            </p>
          </div>
        </div>
      </AdminModal>
    </div>
  );
};

export default Products;
