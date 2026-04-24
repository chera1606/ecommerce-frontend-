// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  const token = localStorage.getItem("token");
  return token ? token.replace(/^Bearer\s+/i, "").trim() : null;
};

/**
 * Core API request handler
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    ...(!(options.body instanceof FormData) && { "Content-Type": "application/json" }),
    "Accept": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData) && !options.skipStringify) {
    body = JSON.stringify(body);
  }

  const config = {
    ...options,
    headers,
    body,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      console.group(`API Request Failed: ${endpoint}`);
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Response Data:`, data);
      console.error(`Headers Sent:`, headers);
      console.groupEnd();
      throw new Error((data && data.message) ? data.message : `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Fetch error for ${endpoint}:`, error);
    throw error;
  }
};

export const publicAPI = {
  getTopProducts: () => apiRequest('/api/products/recommended'),
  getNewArrivals: () => apiRequest('/api/products/new-arrivals'),
  getTopSellers: () => apiRequest('/api/products/top-sellers'),
  getAllProducts: (params = '') => apiRequest(`/api/shop/products${params ? `?${params}` : ''}`),
  getProductById: (id) => apiRequest(`/api/products/${id}`),
  getCategories: () => apiRequest('/api/categories'),
  subscribeNewsletter: (email) => apiRequest('/api/newsletter/subscribe', { method: 'POST', body: { email } }),
  sendContactMessage: (data) => apiRequest('/api/contact', { method: 'POST', body: data }),
};

export const authAPI = {
  login: (credentials) => apiRequest('/api/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => apiRequest('/api/auth/register', { method: 'POST', body: userData }),
  forgotPassword: (data) => apiRequest('/api/auth/forgot-password', { method: 'POST', body: data }),
  resetPassword: (data) => apiRequest('/api/auth/reset-password', { method: 'POST', body: data }),
};

export const cartAPI = {
  getCart: () => apiRequest('/api/cart'),
  addToCart: (item) => apiRequest('/api/cart', { method: 'POST', body: item }),
  updateCartItem: (itemId, data) => apiRequest(`/api/cart/${itemId}`, { method: 'PUT', body: data }),
  removeCartItem: (itemId) => apiRequest(`/api/cart/${itemId}`, { method: 'DELETE' }),
  clearCart: () => apiRequest('/api/cart', { method: 'DELETE' }),
};

export const orderAPI = {
  checkout: (payload) => apiRequest('/api/orders/checkout', { method: 'POST', body: payload }),
  buyNow: (payload) => apiRequest('/api/orders/buy-now', { method: 'POST', body: payload }),
  getMyOrders: () => apiRequest('/api/orders/my-orders')
};

export const userAPI = {
  getProfile: () => apiRequest('/api/users/profile'),
  updateProfile: (data) => apiRequest('/api/users/profile', { method: 'PUT', body: data }),
  updateProfilePhoto: (formData) => apiRequest('/api/users/profile/photo', { method: 'PATCH', body: formData }),
  updatePassword: (data) => apiRequest('/api/users/password', { method: 'PUT', body: data }),
  addAddress: (data) => apiRequest('/api/users/addresses', { method: 'POST', body: data }),
  updateAddress: (id, data) => apiRequest(`/api/users/addresses/${id}`, { method: 'PUT', body: data }),
  deleteAddress: (id) => apiRequest(`/api/users/addresses/${id}`, { method: 'DELETE' })
};

export const reviewAPI = {
  getProductReviews: (productId) => apiRequest(`/api/products/${productId}/reviews`),
  createReview: (productId, data) => apiRequest(`/api/products/${productId}/reviews`, { method: 'POST', body: data })
};

export const adminAPI = {
  getOverview: () => apiRequest('/api/admin/overview'),
  getRecentOrders: () => apiRequest('/api/admin/orders/recent'),
  getOrders: (params = '') => apiRequest(`/api/admin/orders${params ? `?${params}` : ''}`),
  getInventoryStream: () => apiRequest('/api/admin/products/stream'),
  getAdminProducts: (params = '') => apiRequest(`/api/admin/products${params ? `?${params}` : ''}`),
  createProduct: (formData) => apiRequest('/api/admin/products', { method: 'POST', body: formData }),
  updateProduct: (id, formData) => apiRequest(`/api/admin/products/${id}`, { method: 'PUT', body: formData }),
  deleteProduct: (id) => apiRequest(`/api/admin/products/${id}`, { method: 'DELETE' }),
  getOrderDetails: (id) => apiRequest(`/api/admin/orders/${id}`),
  getPerformanceAnalytics: () => apiRequest('/api/admin/analytics/performance'),
  getUsers: (params = '') => apiRequest(`/api/admin/users${params ? `?${params}` : ''}`),
  updateUserStatus: (id, status) => apiRequest(`/api/admin/users/${id}/status`, { method: 'PATCH', body: { status } }),
  updateUserRole: (id, role) => apiRequest(`/api/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
  updateOrderStatus: (id, status) => apiRequest(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  getAdminMessages: () => apiRequest('/api/admin/messages'),
  deleteMessage: (id) => apiRequest(`/api/admin/messages/${id}`, { method: 'DELETE' }),
  updateMessageStatus: (id, status) => apiRequest(`/api/admin/messages/${id}/status`, { method: 'PATCH', body: { status } }),
  getSubscribers: () => apiRequest('/api/admin/newsletter'),
  deleteSubscriber: (id) => apiRequest(`/api/admin/newsletter/${id}`, { method: 'DELETE' }),
  getProfile: () => apiRequest('/api/admin/profile'),
  updateProfile: (data) => apiRequest('/api/admin/profile', { method: 'PUT', body: data }),
  updateProfilePhoto: (formData) => apiRequest('/api/admin/profile/photo', { method: 'PATCH', body: formData }),
  updatePassword: (data) => apiRequest('/api/admin/profile/password', { method: 'PUT', body: data }),
};

export const notificationAPI = {
  getNotifications: () => apiRequest('/api/notifications'),
  markAsRead: (id) => apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => apiRequest('/api/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id) => apiRequest(`/api/notifications/${id}`, { method: 'DELETE' })
};
