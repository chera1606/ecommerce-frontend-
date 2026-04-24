import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  CheckCircle,
  FastForward,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { orderAPI } from '../services/api';
import './Checkout.css';

const FALLBACK_ITEM_IMAGE = 'https://placehold.co/120x120/f5f0eb/2d6a4f?text=Item';

const Checkout = () => {
  const { formatPrice, t } = useAppSettings();
  const navigate = useNavigate();
  const { cartItems, refreshCart } = useCart();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      navigate('/login?redirect=checkout');
    }
  }, [token, navigate]);

  const checkoutItems = cartItems.filter((item) => item.selected);
  const stockIssues = checkoutItems.filter((item) => {
    const availableStock = Number(item.availableStock ?? item.stock ?? item.inventoryLevel ?? item.productId?.stock ?? item.productId?.inventoryLevel ?? 0);
    if (availableStock <= 0) return true;
    return item.quantity > availableStock;
  });
  const hasStockIssue = stockIssues.length > 0;

  const [formData, setFormData] = useState({
    contactName: '',
    phone: '',
    country: '',
    address: ''
  });
  const [deliveryMethod, setDeliveryMethod] = useState('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState('CHAPA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState('new');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { userAPI } = await import('../services/api');
        const res = await userAPI.getProfile();

        if (res.success) {
          const addresses = res.data.addresses || [];
          setUserAddresses(addresses);

          if (addresses.length > 0) {
            const defaultAddr = addresses.find((address) => address.isDefault) || addresses[0];
            setSelectedAddrId(defaultAddr._id);
            setFormData({
              contactName: defaultAddr.contactName || '',
              phone: defaultAddr.phone || '',
              country: defaultAddr.country || '',
              address: defaultAddr.address || ''
            });
          }
        }
      } catch {
        // Keep empty form when profile data is unavailable.
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (checkoutItems.length === 0 && !orderSuccess) {
      navigate('/cart');
    }
  }, [checkoutItems.length, navigate, orderSuccess]);

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping =
    deliveryMethod === 'URGENT'
      ? (subtotal > 150 ? 0 : 15) + 5
      : subtotal > 150
        ? 0
        : 15;
  const total = subtotal + shipping;
  const paymentLabel = paymentMethod === 'TELEBIRR' ? 'Telebirr' : 'Chapa';
  const canSubmit = !loading && checkoutItems.length > 0 && !hasStockIssue;

  const handleSelectSavedAddress = (address) => {
    setSelectedAddrId(address._id);
    setFormData({
      contactName: address.contactName,
      phone: address.phone,
      country: address.country,
      address: address.address
    });
  };

  const handleNewAddressEntry = () => {
    setSelectedAddrId('new');
    setFormData({ contactName: '', phone: '', country: '', address: '' });
  };

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      urgentDelivery: deliveryMethod === 'URGENT',
      paymentMethod,
      shippingAddress: formData,
      selectedItemIds: checkoutItems.map((item) => item.cartItemId)
    };

    try {
      await orderAPI.checkout(payload);

      try {
        const { userAPI } = await import('../services/api');
        await userAPI.addAddress({ ...formData, isDefault: false });
      } catch (addressErr) {
        console.warn('Checkout succeeded, but saving the address failed.', addressErr);
      }

      setOrderSuccess(true);
    } catch (err) {
      setError(err.message || t('Checkout failed. Please review your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const finalizeOrder = async () => {
    await refreshCart();
    navigate('/shop');
  };

  if (orderSuccess) {
    return (
      <div className="success-overlay">
        <div className="success-modal animate-fade-in">
          <div className="success-icon">
            <CheckCircle size={34} />
          </div>
          <h2>Order confirmed</h2>
          <p>
            {t('Your payment with')} <strong>{paymentLabel}</strong> {t('is being processed.')}
          </p>
          <button className="checkout-submit-btn" onClick={finalizeOrder}>
            {t('continueShopping')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <div>
            <p className="checkout-eyebrow">{t('Checkout')}</p>
            <h1 className="checkout-title">{t('Complete your order')}</h1>
          </div>
          <div className="checkout-header-note">
            <ShieldCheck size={16} />
            <span>{t('Encrypted payment and secure order handling')}</span>
          </div>
        </div>

        <div className="checkout-layout">
          <form onSubmit={handleCheckout} className="checkout-form">
            <section className="checkout-section">
              <div className="checkout-section-head">
                <h2><span className="step-num">1</span> {t('Shipping Details')}</h2>
                <p>{t('Choose a saved address or enter a new delivery location.')}</p>
              </div>

              {userAddresses.length > 0 ? (
                <div className="saved-addresses-selector">
                  {userAddresses.map((address) => (
                    <button
                      key={address._id}
                      type="button"
                      className={`address-card-mini ${selectedAddrId === address._id ? 'active' : ''}`}
                      onClick={() => handleSelectSavedAddress(address)}
                    >
                      <strong>{address.contactName}</strong>
                      <span>{address.phone}</span>
                      <p>{address.address}</p>
                    </button>
                  ))}

                  <button
                    type="button"
                    className={`address-card-mini address-card-add ${selectedAddrId === 'new' ? 'active' : ''}`}
                    onClick={handleNewAddressEntry}
                  >
                    <strong>{t('Use a new address')}</strong>
                    <span>{t('Enter a different delivery location')}</span>
                  </button>
                </div>
              ) : null}

              <div className="form-grid">
                <div className="form-group full">
                  <label>{t('Full Name')}</label>
                  <input
                    type="text"
                    name="contactName"
                    className="form-input"
                    placeholder="Abebe Girma"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('Phone Number')}</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    placeholder="+251 911 23 45 67"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('Country / Region')}</label>
                  <input
                    type="text"
                    name="country"
                    className="form-input"
                    placeholder="Ethiopia"
                    value={formData.country}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group full">
                  <label>{t('Address Line')}</label>
                  <input
                    type="text"
                    name="address"
                    className="form-input"
                    placeholder="Bole Road, Addis Ababa"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <div className="checkout-section-head">
                <h2><span className="step-num">2</span> {t('Delivery Method')}</h2>
                <p>{t('Select the shipping speed that works best for this order.')}</p>
              </div>

              <div className="options-grid">
                <button
                  type="button"
                  className={`option-card ${deliveryMethod === 'STANDARD' ? 'active' : ''}`}
                  onClick={() => setDeliveryMethod('STANDARD')}
                >
                  <div className="option-card-header">
                    <span className="option-card-title">
                      <Truck size={16} />
                      {t('Standard')}
                    </span>
                    <span className="option-card-price">{shipping === 0 && deliveryMethod === 'STANDARD' ? t('free') : formatPrice(15)}</span>
                  </div>
                  <p>{t('Delivery in 3 to 5 business days.')}</p>
                </button>

                <button
                  type="button"
                  className={`option-card ${deliveryMethod === 'URGENT' ? 'active' : ''}`}
                  onClick={() => setDeliveryMethod('URGENT')}
                >
                  <div className="option-card-header">
                    <span className="option-card-title">
                      <FastForward size={16} />
                      {t('Urgent')}
                    </span>
                    <span className="option-card-price">{subtotal > 150 ? `+${formatPrice(5)}` : formatPrice(20)}</span>
                  </div>
                  <p>{t('Priority delivery within 24 to 48 hours.')}</p>
                </button>
              </div>
            </section>

            <section className="checkout-section">
              <div className="checkout-section-head">
                <h2><span className="step-num">3</span> {t('Payment Method')}</h2>
                <p>{t('Use your preferred payment provider to complete the order.')}</p>
              </div>

              <div className="options-grid">
                <button
                  type="button"
                  className={`option-card payment-card ${paymentMethod === 'CHAPA' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('CHAPA')}
                >
                  <img
                    src="https://chapa.co/assets/logo.png"
                    alt="Chapa"
                    className="payment-logo"
                    onError={(event) => {
                      event.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/4/41/Chapa_logo_green.png';
                    }}
                  />
                  <div className="payment-card-label">{t('Pay with Chapa')}</div>
                  {paymentMethod === 'CHAPA' ? <Check size={16} className="payment-check" /> : null}
                </button>

                <button
                  type="button"
                  className={`option-card payment-card ${paymentMethod === 'TELEBIRR' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('TELEBIRR')}
                >
                  <img
                    src="https://www.ethiotelecom.et/wp-content/uploads/2021/05/telebirr-logo.png"
                    alt="Telebirr"
                    className="payment-logo"
                    onError={(event) => {
                    event.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="payment-card-label">Telebirr</div>
                  {paymentMethod === 'TELEBIRR' ? <Check size={16} className="payment-check" /> : null}
                </button>
              </div>
            </section>

            {hasStockIssue ? (
              <p className="checkout-error">
                {t('Some selected items are out of stock or exceed the available quantity. Please update your cart before checking out.')}
              </p>
            ) : null}

            <button type="submit" className="checkout-submit-btn" disabled={!canSubmit}>
              {loading ? t('Processing...') : `${t('Pay')} ${formatPrice(total)}`}
            </button>

            {error ? <p className="checkout-error">{error}</p> : null}
          </form>

          <aside className="checkout-summary">
            <div className="checkout-summary-head">
              <h2 className="summary-title">Order Summary</h2>
              <span>{checkoutItems.length} item{checkoutItems.length === 1 ? '' : 's'}</span>
            </div>

            <div className="summary-items">
              {checkoutItems.map((item, index) => (
                <div key={item.cartItemId || index} className="summary-item">
                  <div className="summary-item-img">
                    <img
                      src={item.imageUrl || item.productId?.imageUrl || FALLBACK_ITEM_IMAGE}
                      alt={item.name}
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_ITEM_IMAGE;
                      }}
                    />
                    <span className="summary-item-qty">{item.quantity}</span>
                  </div>

                  <div className="summary-item-info">
                    <div className="summary-item-header">
                      <h4 className="summary-item-title">{item.name}</h4>
                      <span className="summary-item-price">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    <span className="summary-item-vars">
                      {[item.selectedSize, item.selectedColor].filter(Boolean).join(' / ') || t('Standard option')}
                    </span>
                    <span className="summary-item-stock">
                      {Number(item.availableStock ?? item.stock ?? item.inventoryLevel ?? item.productId?.stock ?? item.productId?.inventoryLevel ?? 0) > 0
                        ? t('{count} available', { count: Number(item.availableStock ?? item.stock ?? item.inventoryLevel ?? item.productId?.stock ?? item.productId?.inventoryLevel ?? 0) })
                        : t('Out of stock')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>{t('shipping')}</span>
                <span>{shipping === 0 ? t('free') : formatPrice(shipping)}</span>
              </div>
              <div className="summary-row total">
                <span>{t('total')}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="secure-payment">
              <ShieldCheck size={15} />
              <span>{t('Payments are encrypted and processed securely.')}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
