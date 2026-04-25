import React, { useState } from 'react';
import './Contact.css';
import { Mail, Phone, MapPin, Clock, Loader2 } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { publicAPI } from '../services/api';

const Contact = () => {
  const { t } = useAppSettings();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await publicAPI.sendContactMessage(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero contact-wrap">
        <div className="contact-container">
          <span className="contact-kicker">{t('Contact')}</span>
          <h1>{t('We are here to help')}</h1>
          <p>{t('Questions about orders, returns, or your account? Reach us directly.')}</p>
        </div>
      </section>

      <section className="contact-wrap">
        <div className="contact-container contact-grid">
          <div className="contact-form-side">
            <h2>{t('Send us a message')}</h2>
            {success ? (
              <div className="contact-success-box animate-fade">
                <h3>{t('Message Sent!')}</h3>
                <p>{t('Thank you for your message. We will get back to you soon.')}</p>
                <button className="contact-submit-btn" onClick={() => setSuccess(false)}>{t('Send another message')}</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{t('Full Name')}</label>
                  <input 
                    type="text" 
                    placeholder={t('Enter your name')} 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('Email Address')}</label>
                  <input 
                    type="email" 
                    placeholder={t('Enter your email')} 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('Message')}</label>
                  <textarea 
                    rows="5" 
                    placeholder={t('How can we help?')} 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>
                {error && <p className="contact-error-msg">{error}</p>}
                <button type="submit" className="contact-submit-btn" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={20} /> : t('Send Message')}
                </button>
              </form>
            )}
          </div>

          <div className="contact-info-side">
            <aside className="contact-info">
              <h2>{t('Support Information')}</h2>

              <a href="mailto:support@efoygabeya.com" className="info-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Mail size={18} />
                <div>
                  <strong>{t('Email')}</strong>
                  <p>support@efoygabeya.com</p>
                </div>
              </a>

              <a href="tel:+251911223344" className="info-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Phone size={18} />
                <div>
                  <strong>{t('Phone')}</strong>
                  <p>+251 911 22 33 44</p>
                </div>
              </a>

              <a href="https://maps.google.com/?q=Bole+Road,+Addis+Ababa" target="_blank" rel="noopener noreferrer" className="info-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <MapPin size={18} />
                <div>
                  <strong>{t('Address')}</strong>
                  <p>Bole Road, Addis Ababa</p>
                </div>
              </a>
            </aside>

            <aside className="contact-info">
              <h2>{t('Working Hours')}</h2>
              <div className="info-item">
                <Clock size={18} />
                <div>
                  <strong>{t('Monday - Friday')}</strong>
                  <p>8:30 AM - 6:00 PM</p>
                </div>
              </div>
              <div className="info-item">
                <Clock size={18} />
                <div>
                  <strong>{t('Saturday')}</strong>
                  <p>9:00 AM - 1:00 PM</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
