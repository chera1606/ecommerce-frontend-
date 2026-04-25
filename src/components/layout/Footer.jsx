import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Mail, 
  MapPin, 
  Phone, 
  Store
} from 'lucide-react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useAppSettings();

  return (
    <footer className="hifi-footer">
      <div className="container footer-upper">
        {/* Brand Column */}
        <div className="footer-col brand-signup">
          <Link to="/" className="footer-logo">
            <Store size={30} strokeWidth={1.5} />
            <span>Efoy Gabeya</span>
          </Link>
          <p className="footer-tagline">
            {t('Your trusted marketplace for quality products and fast delivery. Providing excellent service across Ethiopia.')}
          </p>
        </div>

        {/* Navigation Columns */}
        <div className="footer-nav-grid">
          <div className="footer-col">
            <h5>{t('quickLinks')}</h5>
            <ul>
              <li><Link to="/">{t('home')}</Link></li>
              <li><Link to="/shop">{t('shop')}</Link></li>
              <li><Link to="/about">{t('about')}</Link></li>
              <li><Link to="/contact">{t('contact')}</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>{t('customerCare')}</h5>
            <ul>
              <li><Link to="/profile">{t('My Account')}</Link></li>
              <li><Link to="/profile">{t('Check Orders')}</Link></li>
              <li><Link to="/contact">{t('Support')}</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>{t('headquarters')}</h5>
            <ul className="contact-list">
              <li><MapPin size={14} /> <span>Bole Road, Addis Ababa</span></li>
              <li><Phone size={14} /> <span>+251 911 223344</span></li>
              <li><Mail size={14} /> <span>hub@efoygabeya.com</span></li>
            </ul>

          </div>
        </div>
      </div>

      <div className="footer-lower">
        <div className="container lower-inner">
          <div className="legal-info">
            <p>&copy; {currentYear} {t('Efoy Gabeya Marketplace. All rights reserved.')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
