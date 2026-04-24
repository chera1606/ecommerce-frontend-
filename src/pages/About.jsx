import React from 'react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import './About.css';

const About = () => {
  const { t } = useAppSettings();

  return (
    <div className="about-page">
      <section className="about-hero section-wrap">
        <div className="about-container">
          <span className="about-kicker">{t('About Us')}</span>
          <h1>{t('Simple, trusted shopping for everyday needs.')}</h1>
          <p>
            {t('We build a modern ecommerce experience that helps customers find quality products quickly, place orders confidently, and get reliable support.')}
          </p>
        </div>
      </section>

      <section className="section-wrap">
        <div className="about-container about-grid">
          <div className="about-card">
            <h2>{t('Our Mission')}</h2>
            <p>
              {t('Deliver a clean and dependable online shopping platform focused on quality, transparency, and convenience.')}
            </p>
          </div>
          <div className="about-card">
            <h2>{t('Our Promise')}</h2>
            <p>
              {t('Clear pricing, secure checkout, trusted products, and responsive customer support every step of the way.')}
            </p>
          </div>
        </div>
      </section>

      <section className="section-wrap section-muted">
        <div className="about-container">
          <h2 className="section-title">{t('What matters most')}</h2>
          <ul className="about-list">
            <li>{t('Curated products with clear details')}</li>
            <li>{t('Fast and secure checkout flow')}</li>
            <li>{t('Reliable delivery updates')}</li>
            <li>{t('Friendly and practical support')}</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default About;
