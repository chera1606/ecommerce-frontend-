import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import './Auth.css';
import { User, Mail, Lock, ArrowRight, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { getPostLoginRoute } from '../utils/roles';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const validatePassword = (pass) => {
    // Only check for minimum 8 characters
    return pass.length >= 8;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = formData.email.trim();
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    
    // Validation
    if (!firstName || !lastName || !email || !formData.password) {
      return setError(t('All fields are required.'));
    }

    if (!EMAIL_REGEX.test(email)) {
      return setError(t('Please enter a valid email address.'));
    }

    if (!validatePassword(formData.password)) {
      return setError(t('Password must be at least 8 characters long.'));
    }

    if (formData.password !== formData.confirmPassword) {
      return setError(t('Passwords do not match.'));
    }
    
    setLoading(true);
    setError('');

    try {
      await authAPI.register({
        firstName,
        lastName,
        email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || t('Registration failed. Try using a different email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-split">
      {/* Visual Side */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <h1>{t('Start Your')} <br />{t('Journey.')}</h1>
          <p>{t('Join the Efoy Gabeya community and discover a world of premium quality and fast delivery.')}</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-container">
        <Link to="/" className="back-btn-fixed">
          <ArrowLeft size={16} /> {t('storefront')}
        </Link>

        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>{t('Join Us')}</h2>
            <p>{t('Create your account in seconds')}</p>
          </div>

          <form onSubmit={handleSubmit} className="modern-auth-form">
            {error && <div className="auth-error-pill">{error}</div>}

            <div className="input-row">
              <div className="input-group">
                <label>{t('First Name')}</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input 
                    type="text" 
                    name="firstName"
                    placeholder="Abebe"
                    value={formData.firstName}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              <div className="input-group">
                <label>{t('Last Name')}</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input 
                    type="text" 
                    name="lastName"
                    placeholder="Girma"
                    value={formData.lastName}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
            </div>

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

            <div className="input-row">
              <div className="input-group">
                <label>{t('Password')}</label>
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
              <div className="input-group">
                <label>{t('Confirm')}</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input 
                    type="password" 
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-auth-solid" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <>{t('Sign Up Now')} <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="auth-footer">
            <p>{t('Already a member?')} <Link to="/login">{t('Sign in here')}</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
