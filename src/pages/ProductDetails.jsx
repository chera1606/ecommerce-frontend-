import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Minus,
  Package,
  Palette,
  Plus,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star
} from 'lucide-react';
import { publicAPI, reviewAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import ProductCard from '../components/common/ProductCard';
import './ProductDetails.css';

const FALLBACK_IMAGE = 'https://placehold.co/900x900/f5f0eb/57534e?text=No+Image';

const getProductPrice = (product) => Number(product?.price ?? product?.unitPrice ?? 0);

const getCategoryId = (product) => product?.category?._id || product?.category || '';

const getCategoryLabel = (product) =>
  product?.category?.name || product?.classification || 'Product';

const getColorOptions = (product) =>
  Array.from(new Set([...(product?.colors || []), product?.color].filter(Boolean)));

const getGalleryImages = (product) =>
  Array.from(new Set([product?.imageUrl, ...(product?.images || [])].filter(Boolean)));

const getVariantSummary = (product, colorOptions) => {
  const summaryParts = [];

  if (product?.sizes?.length) {
    summaryParts.push(`${product.sizes.length} size${product.sizes.length === 1 ? '' : 's'}`);
  }

  if (colorOptions.length) {
    summaryParts.push(`${colorOptions.length} color${colorOptions.length === 1 ? '' : 's'}`);
  }

  return summaryParts.join(' • ');
};

const getSpecLines = (product) => {
  const rawSpecs = product?.specs || product?.technicalSpecs || '';
  return rawSpecs
    .split(/\r?\n|\u2022|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);
};

const scoreRelatedProduct = (candidate, product) => {
  let score = Number(candidate?.rating || 0);

  if (String(getCategoryId(candidate)) === String(getCategoryId(product))) {
    score += 4;
  }

  if (candidate?.classification && candidate.classification === product?.classification) {
    score += 2;
  }

  const sourceColors = getColorOptions(product);
  const candidateColors = getColorOptions(candidate);

  if (sourceColors.some((color) => candidateColors.includes(color))) {
    score += 1;
  }

  return score;
};

const RatingStars = ({ rating, size = 16 }) => (
  <div className="pd-stars" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = star <= Math.round(rating);
      return (
        <Star
          key={star}
          size={size}
          fill={filled ? 'currentColor' : 'none'}
          color={filled ? 'currentColor' : '#d6d3d1'}
        />
      );
    })}
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { token } = useAuth();
  const { formatPrice, t } = useAppSettings();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [mainImage, setMainImage] = useState(FALLBACK_IMAGE);
  const [shareMessage, setShareMessage] = useState('');

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    if (!shareMessage) return undefined;

    const timer = window.setTimeout(() => setShareMessage(''), 2200);
    return () => window.clearTimeout(timer);
  }, [shareMessage]);

  useEffect(() => {
    let ignore = false;

    const loadProduct = async () => {
      setLoading(true);
      setRelatedLoading(true);
      setProduct(null);
      setRelatedProducts([]);
      setQuantity(1);
      setReviewError('');
      setReviewSuccess('');

      try {
        window.scrollTo(0, 0);

        const response = await publicAPI.getProductById(id);
        if (ignore) return;

        const nextProduct = response.data;
        const galleryImages = getGalleryImages(nextProduct);
        const colorOptions = getColorOptions(nextProduct);

        setProduct(nextProduct);
        setMainImage(galleryImages[0] || FALLBACK_IMAGE);
        setSelectedSize(nextProduct?.sizes?.[0] || '');
        setSelectedColor(colorOptions[0] || '');

        const primaryParams = new URLSearchParams({
          limit: '8',
          sort: 'rating'
        });

        const categoryId = getCategoryId(nextProduct);
        if (categoryId) {
          primaryParams.set('category', String(categoryId));
        }

        const [shopResponse, recommendedResponse] = await Promise.all([
          publicAPI.getAllProducts(primaryParams.toString()).catch(() => ({ data: [] })),
          publicAPI.getTopProducts().catch(() => ({ data: [] }))
        ]);

        if (ignore) return;

        const seen = new Set();
        const merged = [...(shopResponse.data || []), ...(recommendedResponse.data || [])]
          .filter((item) => item?._id && item._id !== nextProduct._id)
          .filter((item) => {
            if (seen.has(item._id)) return false;
            seen.add(item._id);
            return true;
          })
          .sort((a, b) => scoreRelatedProduct(b, nextProduct) - scoreRelatedProduct(a, nextProduct))
          .slice(0, 4);

        setRelatedProducts(merged);
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        if (!ignore) {
          setLoading(false);
          setRelatedLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    let ignore = false;

    const fetchReviews = async () => {
      setReviewsLoading(true);

      try {
        const response = await reviewAPI.getProductReviews(id);
        if (!ignore && response.success) {
          setReviews(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        if (!ignore) {
          setReviews([]);
        }
      } finally {
        if (!ignore) {
          setReviewsLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name,
          text: `Take a look at ${product?.name}`,
          url
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareMessage('Product link copied.');
        return;
      }
    } catch (error) {
      console.error('Share failed:', error);
    }

    setShareMessage(t('Sharing is not available on this browser.'));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setReviewError('Please log in to leave a review.');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError(t('Please enter a comment before submitting.'));
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const response = await reviewAPI.createReview(id, {
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      if (response.success) {
        const reviewsResponse = await reviewAPI.getProductReviews(id);
        setReviews(reviewsResponse.data || []);
        setReviewComment('');
        setReviewRating(5);
        setReviewSuccess(t('Thank you for sharing your feedback.'));
      }
    } catch (error) {
      setReviewError(error.message || t('Failed to submit review.'));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-container">
          <div className="pd-loading-card">{t('Loading product details...')}</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pd-page">
        <div className="pd-container">
          <div className="pd-empty-state">
            <h2>{t('Product not found')}</h2>
            <p>{t('The item you requested could not be loaded.')}</p>
            <Link to="/shop" className="pd-primary-btn">
              {t('Return to Shop')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const galleryImages = getGalleryImages(product);
  const price = getProductPrice(product);
  const originalPrice = Number(product.originalPrice || 0);
  const discount =
    originalPrice > price && price > 0
      ? Math.round((1 - price / originalPrice) * 100)
      : null;
  const inventoryCount = Number(product.inventoryLevel ?? product.stock ?? 0);
  const reviewCount = reviews.length || Number(product.numReviews || 0);
  const averageRating = reviewCount
    ? (reviews.length
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
        : Number(product.rating || 0))
    : 0;
  const colorOptions = getColorOptions(product);
  const specLines = getSpecLines(product);
  const summaryText = product.description?.trim() || '';
  const variantSummary = getVariantSummary(product, colorOptions);
  const quickFacts = [
    {
      icon: Package,
      label: t('Availability'),
      value: inventoryCount > 0 ? t('{count} in stock', { count: inventoryCount }) : t('Out of stock')
    },
    {
      icon: Star,
      label: t('Rating'),
      value: reviewCount
        ? t('{rating} from {count} reviews', { rating: averageRating.toFixed(1), count: reviewCount })
        : t('No reviews yet')
    },
    {
      icon: BadgeCheck,
      label: t('Variants'),
      value: variantSummary || t('Single configuration')
    }
  ];
  const detailFacts = [
    {
      icon: Package,
      label: t('Availability'),
      value: inventoryCount > 0 ? t('{count} in stock', { count: inventoryCount }) : t('Out of stock')
    },
    {
      icon: BadgeCheck,
      label: t('Category'),
      value: getCategoryLabel(product)
    },
    product.sku ? {
      icon: ShieldCheck,
      label: 'SKU',
      value: product.sku
    } : null,
    product.sizes?.length ? {
      icon: Ruler,
      label: t('Sizes'),
      value: product.sizes.join(', ')
    } : null,
    colorOptions.length ? {
      icon: Palette,
      label: t('Colors'),
      value: colorOptions.join(', ')
    } : null,
    product.salesCount ? {
      icon: ShoppingCart,
      label: t('Units sold'),
      value: t('{count} total', { count: product.salesCount })
    } : null,
    ...specLines.map((line) => ({
      icon: ShieldCheck,
      label: t('Specification'),
      value: line
    }))
  ].filter(Boolean);

  const handleAddToCart = async () => {
    if (inventoryCount <= 0) return;
    await addToCart(product, quantity, selectedSize, selectedColor, { mode: 'set' });
  };

  const handleBuyNow = async () => {
    if (inventoryCount <= 0) return;

    if (!token) {
      await addToCart(product, quantity, selectedSize, selectedColor, { mode: 'set' });
      return;
    }

    await addToCart(product, quantity, selectedSize, selectedColor, { mode: 'set', openDrawer: false });
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="pd-page">
      <div className="pd-container">
        <div className="pd-topbar">
          <Link to="/shop" className="pd-back-link">
            <ArrowLeft size={16} />
            {t('Back to Shop')}
          </Link>
          <span className="pd-category-pill">{getCategoryLabel(product)}</span>
        </div>

        <section className="pd-hero">
          <div className="pd-gallery-card">
            <div className="pd-main-media">
              <img
                src={mainImage || FALLBACK_IMAGE}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="pd-media-badges">
                {inventoryCount > 0 ? (
                  <span className="pd-badge pd-badge-success">{t('In Stock')}</span>
                ) : (
                  <span className="pd-badge pd-badge-muted">{t('Out of Stock')}</span>
                )}
                {discount ? <span className="pd-badge pd-badge-accent">{discount}% {t('off')}</span> : null}
              </div>
            </div>

            {galleryImages.length > 1 ? (
              <div className="pd-thumb-row">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`pd-thumb ${mainImage === image ? 'active' : ''}`}
                    onClick={() => setMainImage(image)}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="pd-summary-card">
            <div className="pd-summary-head">
              <div>
                <p className="pd-eyebrow">{getCategoryLabel(product)}</p>
                <h1 className="pd-title">{product.name}</h1>
              </div>

              <button type="button" className="pd-icon-btn" onClick={handleShare}>
                <Share2 size={18} />
              </button>
            </div>

            <div className="pd-meta-row">
              <div className="pd-rating-wrap">
                <RatingStars rating={averageRating} />
                <span className="pd-rating-value">{averageRating.toFixed(1)}</span>
                <a href="#reviews" className="pd-inline-link">
                  {reviewCount} {reviewCount === 1 ? t('review') : t('reviews')}
                </a>
              </div>
              <span className="pd-meta-divider" />
              <span className="pd-sku">SKU: {product.sku || t('N/A')}</span>
            </div>

            <div className="pd-price-block">
              <div className="pd-price-row">
                <span className="pd-price">{formatPrice(price)}</span>
                {originalPrice > price ? (
                  <span className="pd-original-price">{formatPrice(originalPrice)}</span>
                ) : null}
              </div>
              <p className="pd-stock-copy">
                {inventoryCount > 0
                  ? t('{count} units available for immediate order.', { count: inventoryCount })
                  : t('Currently unavailable. Please check back soon.')}
              </p>
            </div>

            {summaryText ? <p className="pd-summary-text">{summaryText}</p> : null}

            <div className="pd-quick-facts">
              {quickFacts.map((fact) => {
                const Icon = fact.icon;

                return (
                  <article key={fact.label} className="pd-fact-card">
                    <Icon size={18} />
                    <div>
                      <span>{fact.label}</span>
                      <strong>{fact.value}</strong>
                    </div>
                  </article>
                );
              })}
            </div>

            {(product.sizes?.length || colorOptions.length) ? (
              <div className="pd-option-stack">
                {product.sizes?.length ? (
                  <div className="pd-option-group">
                    <div className="pd-option-label">
                      <Ruler size={16} />
                      <span>{t('Choose size')}</span>
                    </div>
                    <div className="pd-option-list">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`pd-option-btn ${selectedSize === size ? 'active' : ''}`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {colorOptions.length ? (
                  <div className="pd-option-group">
                    <div className="pd-option-label">
                      <Palette size={16} />
                      <span>{t('Choose color')}</span>
                    </div>
                    <div className="pd-option-list">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`pd-option-btn ${selectedColor === color ? 'active' : ''}`}
                          onClick={() => setSelectedColor(color)}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="pd-purchase-card">
              <div className="pd-qty-row">
                <span className="pd-qty-label">{t('Quantity')}</span>
                <div className="pd-qty-picker">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) =>
                        Math.min(current + 1, inventoryCount > 0 ? inventoryCount : current + 1)
                      )
                    }
                    aria-label="Increase quantity"
                    disabled={inventoryCount <= 0 || quantity >= inventoryCount}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="pd-action-row">
                <button
                  type="button"
                  className="pd-primary-btn"
                  onClick={handleAddToCart}
                  disabled={inventoryCount <= 0}
                >
                  <ShoppingCart size={18} />
                  {t('Add to Cart')}
                </button>
                <button
                  type="button"
                  className="pd-secondary-btn"
                  onClick={handleBuyNow}
                  disabled={inventoryCount <= 0}
                >
                  {t('Buy Now')}
                </button>
              </div>

              {shareMessage ? <p className="pd-feedback-text">{shareMessage}</p> : null}
            </div>
          </div>
        </section>

        <section className={`pd-detail-grid ${!summaryText ? 'pd-detail-grid-single' : ''}`}>
          {summaryText ? (
            <article className="pd-panel">
              <h2>{t('Overview')}</h2>
              <p className="pd-panel-copy">{summaryText}</p>
            </article>
          ) : null}

          <article className="pd-panel">
            <h2>{t('Product Details')}</h2>
            <div className="pd-detail-list">
              {detailFacts.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={`${item.label}-${item.value}`} className="pd-detail-item">
                    <Icon size={16} />
                    <div>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="pd-related-section">
          <div className="section-head">
            <div>
              <h2 className="pd-section-title">{t('Related Items')}</h2>
              <p className="pd-section-copy">{t('Products from the same category and style.')}</p>
            </div>
            <Link to="/shop" className="pd-inline-link">
              {t('Browse all')}
            </Link>
          </div>

          {relatedLoading ? (
            <div className="pd-related-grid">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="pd-related-skeleton" />
              ))}
            </div>
          ) : relatedProducts.length ? (
            <div className="pd-related-grid">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct._id}
                  product={relatedProduct}
                  addToCart={addToCart}
                />
              ))}
            </div>
          ) : (
            <div className="pd-panel">
              <p className="pd-panel-copy">{t('No related products were returned by the live catalog yet.')}</p>
            </div>
          )}
        </section>

        <section className="pd-reviews-section" id="reviews">
          <div className="section-head">
            <div>
              <h2 className="pd-section-title">{t('Customer Reviews')}</h2>
              <p className="pd-section-copy">{t('Feedback from customers who purchased this item.')}</p>
            </div>
            <div className="pd-review-score">
              <strong>{averageRating.toFixed(1)}</strong>
              <RatingStars rating={averageRating} />
            </div>
          </div>

          <div className="pd-review-layout">
            <div className="pd-review-form-card">
              <h3>{t('Write a review')}</h3>
              {token ? (
                <form onSubmit={handleReviewSubmit} className="pd-review-form">
                  <div className="pd-review-rating-picker">
                    <span>{t('Your rating')}</span>
                    <div className="pd-rating-input">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`pd-star-btn ${star <= reviewRating ? 'active' : ''}`}
                          onClick={() => setReviewRating(star)}
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            size={20}
                            fill={star <= reviewRating ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    className="pd-review-textarea"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder={t('Share fit, finish, or delivery notes.')}
                  />

                  {reviewError ? <p className="pd-form-message pd-form-error">{reviewError}</p> : null}
                  {reviewSuccess ? <p className="pd-form-message pd-form-success">{reviewSuccess}</p> : null}

                  <button type="submit" className="pd-primary-btn pd-submit-review" disabled={submittingReview}>
                    {submittingReview ? t('Submitting...') : t('Post Review')}
                  </button>
                </form>
              ) : (
                <p className="pd-panel-copy">
                  {t('Please')} <Link to="/login" className="pd-inline-link">{t('log in')}</Link> {t('to leave a review.')}
                </p>
              )}
            </div>

            <div className="pd-review-list">
              {reviewsLoading ? (
                <div className="pd-panel">
                  <p className="pd-panel-copy">{t('Loading reviews...')}</p>
                </div>
              ) : reviews.length ? (
                reviews.map((review) => (
                  <article key={review._id} className="pd-review-card">
                    <div className="pd-review-head">
                      <div className="pd-review-user">
                        {review.user?.profilePicture ? (
                          <img
                            src={review.user.profilePicture}
                            alt={`${review.user.firstName || 'User'} avatar`}
                            className="pd-review-avatar"
                          />
                        ) : (
                          <div className="pd-review-avatar pd-review-avatar-fallback">
                            {(review.user?.firstName || 'U').charAt(0)}
                          </div>
                        )}
                        <div>
                          <strong>
                            {review.user
                              ? `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim()
                              : 'Anonymous'}
                          </strong>
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="pd-review-rating">
                        <RatingStars rating={Number(review.rating || 0)} size={14} />
                        {review.isVerifiedPurchase ? (
                          <span className="pd-verified-tag">{t('Verified purchase')}</span>
                        ) : null}
                      </div>
                    </div>
                    <p className="pd-review-text">{review.comment}</p>
                  </article>
                ))
              ) : (
                <div className="pd-panel">
                  <p className="pd-panel-copy">{t('No reviews yet. Be the first to share your experience.')}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetails;
