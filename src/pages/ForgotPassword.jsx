import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import './Auth.css';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_REGEX = /^\d{6}$/;

const ForgotPassword = () => {
  const [step, setStep] = useState('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const { t } = useAppSettings();

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    const email = formData.email.trim();

    if (!email) {
      setError(t('Please enter your email address.'));
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError(t('Please enter a valid email address.'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authAPI.forgotPassword({ email });
      setSuccess(t('OTP sent. Check your email and enter the code below.'));
      setStep('reset');
    } catch (err) {
      setError(err.message || t('Unable to send reset code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    const email = formData.email.trim();
    const otp = formData.otp.trim();
    const newPassword = formData.newPassword;
    const confirmPassword = formData.confirmPassword;

    if (!otp || !newPassword || !confirmPassword) {
      setError(t('Please fill in the code and both password fields.'));
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError(t('Please enter a valid email address.'));
      return;
    }

    if (!OTP_REGEX.test(otp)) {
      setError(t('Enter the 6-digit code sent to your email.'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('New password must be at least 8 characters long.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('Passwords do not match.'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authAPI.resetPassword({
        email,
        otp,
        newPassword,
        confirmPassword
      });

      setSuccess(t('Password updated successfully. You can sign in now.'));
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message || t('Password reset failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-split auth-page-split-reset">
      <div className="auth-visual auth-visual-reset">
        <div className="auth-visual-content">
          <span className="hero-badge auth-badge-reset">
            <ShieldCheck size={13} fill="currentColor" /> {t('Account Recovery')}
          </span>
          <h1>{t('Recover')} <br />{t('your access.')}</h1>
          <p>{t('Use your email to request a one-time code, then set a new password securely.')}</p>
        </div>
      </div>

      <div className="auth-form-container">
        <Link to="/login" className="back-btn-fixed">
          <ArrowLeft size={16} /> {t('Sign in')}
        </Link>

        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>{step === 'request' ? t('Forgot Password') : t('Reset Password')}</h2>
            <p>{step === 'request' ? t('We will send a one-time code to your email.') : t('Enter the code and set a new password.')}</p>
          </div>

          {step === 'request' ? (
            <form onSubmit={handleSendOtp} className="modern-auth-form">
              {error ? <div className="auth-error-pill">{error}</div> : null}
              {success ? <div className="auth-success-pill">{success}</div> : null}

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

              <button type="submit" className="btn-auth-solid" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <>{t('Send Reset Code')} <ArrowRight size={18} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="modern-auth-form">
              {error ? <div className="auth-error-pill">{error}</div> : null}
              {success ? <div className="auth-success-pill">{success}</div> : null}

              <div className="input-group">
                <label>{t('Email Address')}</label>
                <div className="input-wrapper">
                  <Mail size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>{t('Reset Code')}</label>
                <div className="input-wrapper">
                  <ShieldCheck size={18} />
                  <input
                    type="text"
                    name="otp"
                    placeholder={t('Enter the 6-digit code')}
                    value={formData.otp}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>{t('New Password')}</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input
                      type="password"
                      name="newPassword"
                      placeholder={t('At least 8 characters')}
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>{t('Confirm Password')}</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder={t('Repeat password')}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-auth-solid" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <>{t('Update Password')} <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>{t('Remembered your password?')} <Link to="/login">{t('Back to sign in')}</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
