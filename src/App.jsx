import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails.jsx';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminRoute from './components/admin/AdminRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserRoute from './components/auth/UserRoute';
import StorefrontLayout from './components/layout/StorefrontLayout';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';

function App() {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
            {/* Admin Portal - Completely isolated layout */}
            <Route 
              path="/admin/*" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
              />

            {/* Storefront Layout Wrapper */}
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <UserRoute>
                    <Profile />
                  </UserRoute>
                } 
              />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/register" element={<Register />} />
              {/* Fallback to Home within storefront */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            {/* Global Fallback for safety */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </AppSettingsProvider>
  );
}

export default App;
