import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import './CartDrawer.css';

const CartDrawer = () => {
  const { formatPrice, t } = useAppSettings();
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    cartCount,
    cartTotal,
    removeFromCart,
    updateQuantity
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="cart-drawer-overlay animate-fade-in">
      <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)} />

      <aside className="cart-drawer slide-in-right">
        <div className="cart-header">
          <div>
            <p className="cart-drawer-eyebrow">{t('cart')}</p>
            <h2>{t('Your Bag')}</h2>
          </div>
          <button className="close-btn" onClick={() => setIsCartOpen(false)} aria-label="Close cart drawer">
            <X size={20} />
          </button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={42} strokeWidth={1.2} />
              <div>
                <h3>{t('Your cart is empty')}</h3>
                <p>{t('Add a few items and they will appear here.')}</p>
              </div>
              <button className="btn btn-outline" onClick={() => setIsCartOpen(false)}>
                {t('continueShopping')}
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {cartItems.map((item) => {
                const availableStock = Number(item.availableStock ?? item.stock ?? item.inventoryLevel ?? item.productId?.stock ?? item.productId?.inventoryLevel ?? 0);
                const canIncrease = availableStock > 0 ? item.quantity < availableStock : false;

                return (
                  <article key={item.cartItemId} className="cart-item">
                    <div className="item-image">
                      <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.name} />
                    </div>

                    <div className="item-details">
                      <div className="item-header">
                        <div>
                          <h4>{item.name}</h4>
                          <div className="item-variants">
                            {item.selectedSize ? <span>{item.selectedSize}</span> : null}
                            {item.selectedColor ? <span>{item.selectedColor}</span> : null}
                          </div>
                          <span className={`item-stock-note ${availableStock > 0 ? '' : 'out'}`}>
                            {availableStock > 0 ? t('{count} left', { count: availableStock }) : t('Out of stock')}
                          </span>
                        </div>

                        <button
                          className="remove-btn"
                          onClick={() => removeFromCart(item.cartItemId)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="item-footer">
                        <div className="quantity-controls">
                          <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} disabled={item.quantity <= 1}>
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} disabled={!canIncrease}>
                            +
                          </button>
                        </div>

                        <p className="item-price">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 ? (
          <div className="cart-footer">
          <div className="cart-subtotal">
              <span>{t('subtotal')}</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <p className="tax-note">{t('{count} item(s) ready for checkout', { count: cartCount })}</p>

            <div className="cart-footer-actions">
              <Link to="/cart" className="btn btn-outline btn-full" onClick={() => setIsCartOpen(false)}>
                {t('View Full Cart')}
              </Link>
              <Link 
                to={cartItems.some(item => String(item.cartItemId).startsWith('guest')) ? '/login?redirect=checkout' : '/checkout'} 
                className="btn btn-primary btn-full checkout-btn" 
                onClick={() => setIsCartOpen(false)}
              >
                {cartItems.some(item => String(item.cartItemId).startsWith('guest')) ? t('Login to Checkout') : t('Secure Checkout')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
};

export default CartDrawer;
