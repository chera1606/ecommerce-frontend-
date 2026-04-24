import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import './ProductCard.css';

const ProductCard = ({ product, addToCart, onImageError }) => {
  const [imageError, setImageError] = React.useState(false);
  const { formatPrice, t } = useAppSettings();

  if (imageError) return null; // Hide the card if image fails to load

  const inventoryCount = Number(product.inventoryLevel ?? product.stock ?? 0);
  const isSoldOut = inventoryCount <= 0;
  const isLowStock = inventoryCount > 0 && inventoryCount <= 5;
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;
  const stockLabel = isSoldOut
    ? t('Sold out')
    : isLowStock
      ? t('Only {count} left', { count: inventoryCount })
      : t('{count} in stock', { count: inventoryCount });

  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`} className="card-image-link">
        <div className="card-image">
          <img 
            src={product.imageUrl || 'https://placehold.co/400x400/f5f0eb/57534e?text=No+Image'} 
            alt={product.name} 
            loading="lazy"
            onError={() => { 
              setImageError(true);
              onImageError?.();
            }} 
          />
          {discount && <span className="discount-tag">-{discount}%</span>}
          <span className={`stock-tag ${isSoldOut ? 'sold-out' : isLowStock ? 'low-stock' : 'in-stock'}`}>
            {stockLabel}
          </span>
          <button 
            type="button"
            className="quick-add-btn"
            disabled={isSoldOut}
            onClick={e => { e.preventDefault(); addToCart?.(product, 1); }}
          >
            <ShoppingCart size={15} />
            <span>{isSoldOut ? t('Sold out') : t('Add to Cart')}</span>
          </button>
        </div>
      </Link>
      <div className="card-body">
        <Link to={`/product/${product._id}`} className="card-name-link">
          <p className="card-name">{product.name}</p>
        </Link>
        <div className="card-meta">
          <span className="card-rating">
            <Star size={12} fill="#b45309" color="#b45309" /> {(product.rating || 0).toFixed(1)}
          </span>
          {product.sold && <span className="card-sold">{t('{count} sold', { count: product.sold })}</span>}
        </div>
        <div className="card-footer">
          <div className="card-prices">
            <span className="card-price">{formatPrice(product.price)}</span>
            {product.originalPrice && <span className="card-original">{formatPrice(product.originalPrice)}</span>}
          </div>
          {product.isFreeShipping && <span className="free-ship">{t('Free Ship')}</span>}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
