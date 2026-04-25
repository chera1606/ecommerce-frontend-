import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

const StorefrontLayout = () => {
  const { pathname } = useLocation();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  return (
    <div className="storefront-wrapper">
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <CartDrawer />}
      <main className="main-content">
        <Outlet />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

export default StorefrontLayout;
