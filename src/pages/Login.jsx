import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import './Auth.css';
import { Mail, Lock, ArrowRight, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { getPostLoginRoute, isAdminLikeRole } from '../utils/roles';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const { t } = useAppSettings();

  useEffect(() => {
    if (user) {
      navigate(getPostLoginRoute(user.role), { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = formData.email.trim();
    
    // Basic Validation
    if (!email || !formData.password) {
      setError(t('Please fill in all fields.'));
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError(t('Please enter a valid email address.'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login({ email, password: formData.password });
      const loginData = response?.data || response;
      const { accessToken, ...user } = loginData;

      if (!accessToken || !user?.role) {
        throw new Error(t('Unexpected login response. Please try again.'));
      }
      
      // Use centralized login function
      login(user, accessToken);

      // Role-Based Redirection
      const fallbackRoute = getPostLoginRoute(user.role);
      const fromPath = location.state?.from?.pathname;
      const isAuthPage = fromPath === '/login' || fromPath === '/register' || fromPath === '/forgot-password';
      const hasAdminPath = typeof fromPath === 'string' && fromPath.startsWith('/admin');
      const nextRoute = isAdminLikeRole(user.role)
        ? fallbackRoute
        : (!fromPath || isAuthPage || hasAdminPath ? fallbackRoute : fromPath);

      navigate(nextRoute, { replace: true });
    } catch (err) {
      setError(err.message || t('Invalid email or password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-split">
      {/* Visual Side */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <h1>Efoy <br />Gabeya</h1>
          <p>{t('Sign in to access your curated marketplace, track orders, and discover new arrivals.')}</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-container">
        <Link to="/" className="back-btn-fixed">
          <ArrowLeft size={16} /> {t('storefront')}
        </Link>

        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>{t('Welcome Back')}</h2>
            <p>{t('Please enter your details to sign in.')}</p>
          </div>

          <form onSubmit={handleSubmit} className="modern-auth-form">
            {error && <div className="auth-error-pill">{error}</div>}

            <div className="input-group">
              <label>{t('Email Address')}</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input 
                  type="email" 
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <label>{t('Password')}</label>
                <Link to="/forgot-password" style={{fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-primary)'}}>{t('Forgot?')}</Link>
              </div>
              <div className="input-wrapper">
                <Lock size={18} />
                <input 
                  type="password" 
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn-auth-solid" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <>{t('Sign In')} <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="auth-footer">
            <p>{t('New here?')} <Link to="/register">{t('Create an account')}</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
