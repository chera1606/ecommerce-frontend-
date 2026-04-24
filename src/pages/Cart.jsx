import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CreditCard,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import './Cart.css';

const Cart = () => {
  const { formatPrice, t } = useAppSettings();
  const {
    cartItems,
    removeFromCart,
    removeSelectedItems,
    updateQuantity,
    toggleItemSelection,
    selectAll,
    cartTotal,
    selectedCount,
    selectedLineCount,
    cartCount,
    cartLineCount,
    clearCart
  } = useCart();

  const isAllSelected = cartItems.length > 0 && cartItems.every((item) => item.selected);
  const selectedStockIssues = cartItems.filter((item) => {
    if (!item.selected) return false;
    const availableStock = Number(item.availableStock ?? item.stock ?? item.inventoryLevel ?? item.productId?.stock ?? item.productId?.inventoryLevel ?? 0);
    if (availableStock <= 0) return true;
    return item.quantity > availableStock;
  });
  const hasStockIssue = selectedStockIssues.length > 0;
  const shipping = selectedCount > 0 ? (cartTotal > 150 ? 0 : 15) : 0;
  const total = cartTotal + shipping;
  const canCheckout = selectedLineCount > 0 && !hasStockIssue;

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="empty-cart">
            <ShoppingBag size={70} strokeWidth={1.3} className="empty-cart-icon" />
            <h2>{t('Your cart is empty')}</h2>
            <p>{t('Add products to your bag to review them here and continue to checkout.')}</p>
            <Link to="/shop" className="cart-primary-btn">
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header-block">
          <div>
            <p className="cart-eyebrow">{t('Shopping Cart')}</p>
            <h1 className="cart-title">{t('Review your bag')}</h1>
          </div>
          <div className="cart-header-meta">
            <span>{t('{count} items', { count: cartCount })}</span>
            <span>{t('{count} products', { count: cartLineCount })}</span>
          </div>
        </div>

        <div className="cart-layout">
          <section className="cart-items-section">
            {hasStockIssue ? (
              <div className="cart-stock-alert">
                {t('Some selected items are out of stock or exceed the current stock limit. Please adjust quantities before checkout.')}
              </div>
            ) : null}

            <div className="cart-selection-bar">
              <button type="button" className="selection-control" onClick={() => selectAll(!isAllSelected)}>
                <span className={`aura-checkbox ${isAllSelected ? 'checked' : ''}`}>
                  {isAllSelected ? <Check size={13} /> : null}
                </span>
                <span>{t('Select all')}</span>
              </button>

              <div className="selection-status">
                <span>{t('{count} selected', { count: selectedCount })}</span>
              </div>

              <div className="selection-actions">
                <button
                  type="button"
                  className="selection-action-btn"
                  onClick={removeSelectedItems}
                  disabled={selectedLineCount === 0}
                >
                  {t('Remove selected')}
                </button>
                <button type="button" className="selection-action-btn danger" onClick={clearCart}>
                  {t('Clear cart')}
                </button>
              </div>
            </div>

            <div className="cart-items-list">
              {cartItems.map((item) => (
                <article key={item.cartItemId} className="cart-item-card">
                  <button
                    type="button"
                    className={`aura-checkbox cart-item-check ${item.selected ? 'checked' : ''}`}
                    onClick={() => toggleItemSelection(item.cartItemId)}
                    aria-label={`Select ${item.name}`}
                  >
                    {item.selected ? <Check size={13} /> : null}
                  </button>

                  <Link to={`/product/${item._id}`} className="cart-item-image">
                    <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.name} />
                  </Link>

                  <div className="cart-item-info">
                    <div className="cart-item-header">
                      <div>
                        <Link to={`/product/${item._id}`} className="cart-item-name">
                          {item.name}
                        </Link>
                        <div className="cart-item-variants">
                          {item.selectedSize ? <span>{t('Size')}: {item.selectedSize}</span> : null}
                          {item.selectedColor ? <span>{t('Color')}: {item.selectedColor}</span> : null}
                        </div>
                        {Number(item.availableStock ?? item.stock ?? item.inventoryLevel ?? item.productId?.stock ?? item.productId?.inventoryLevel ?? 0) > 0 ? (
                          <span className="cart-item-stock">
                            {t('Only {count} left', { count: Number(item.availableStock ?? item.stock ?? item.inventoryLevel ?? item.productId?.stock ?? item.productId?.inventoryLevel ?? 0) })}
                          </span>
                        ) : (
                          <span className="cart-item-stock out">{t('Out of stock')}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.cartItemId)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="cart-item-footer">
                      <div className="item-qty-control">
                        <button
                          type="button"
                          className="item-qty-btn"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="item-qty-val">{item.quantity}</span>
                        <button
                          type="button"
                          className="item-qty-btn"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          disabled={Number(item.availableStock ?? item.stock ?? item.inventoryLevel ?? item.productId?.stock ?? item.productId?.inventoryLevel ?? 0) > 0
                            ? item.quantity >= Number(item.availableStock ?? item.stock ?? item.inventoryLevel ?? item.productId?.stock ?? item.productId?.inventoryLevel ?? 0)
                            : true}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="cart-item-pricing">
                        <span className="cart-item-unit">{formatPrice(item.price)} {t('each')}</span>
                        
                        <p className="cart-item-price">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="cart-summary">
            <div className="cart-summary-head">
              <h2 className="summary-title">{t('Order Summary')}</h2>
              <p>{t('Only selected items move to checkout.')}</p>
            </div>

            <div className="summary-group">
              <div className="summary-row">
                <span>{t('Selected items')}</span>
                <span>{selectedCount}</span>
              </div>
              <div className="summary-row">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="summary-row">
                <span>{t('shipping')}</span>
                <span>{shipping === 0 ? (selectedCount > 0 ? t('free') : formatPrice(0)) : formatPrice(shipping)}</span>
              </div>
              <div className="summary-row">
                <span>{t('Taxes')}</span>
                <span>{t('Calculated at checkout')}</span>
              </div>
            </div>

            <div className="summary-row total">
              <span>{t('total')}</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Link
              to={canCheckout ? '/checkout' : '#'}
              className={`checkout-btn-lg ${canCheckout ? '' : 'disabled'}`}
              aria-disabled={!canCheckout}
            >
              {t('Secure Checkout')}
              {selectedCount > 0 ? <span className="checkout-count">{selectedCount}</span> : null}
              <ArrowRight size={18} />
            </Link>

            <Link to="/shop" className="cart-secondary-link">
              {t('Continue shopping')}
            </Link>

            <div className="secure-payment">
              <div className="secure-chip">
                <ShieldCheck size={15} />
                <span>{t('Secure payment')}</span>
              </div>
              <div className="secure-chip">
                <Truck size={15} />
                <span>{t('Tracked shipping')}</span>
              </div>
              <div className="secure-chip">
                <CreditCard size={15} />
                <span>{t('Protected checkout')}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;
