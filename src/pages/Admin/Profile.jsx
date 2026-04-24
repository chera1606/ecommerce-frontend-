import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Camera, 
  Lock, 
  ShieldCheck, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Key
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import './AdminProfile.css';

const AdminProfileContent = ({ user, login }) => {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { t } = useAppSettings();

  // Form States
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [photoPreview, setPhotoPreview] = useState(user?.profilePicture || null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await adminAPI.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName
      });
      
      if (res.success) {
        login({ ...user, firstName: profileForm.firstName, lastName: profileForm.lastName }, localStorage.getItem('token'));
        setMessage({ type: 'success', text: t('Personal information updated successfully!') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || t('Failed to update profile') });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setMessage({ type: 'error', text: t('Passwords do not match') });
    }
    if ((passwordForm.newPassword || '').length < 8) {
      return setMessage({ type: 'error', text: t('New password must be at least 8 characters long') });
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await adminAPI.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      setMessage({ type: 'success', text: t('Password changed successfully!') });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || t('Failed to change password') });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile) return;
    
    setSubmitting(true);
    const data = new FormData();
    data.append('image', selectedFile);

    try {
      const res = await adminAPI.updateProfilePhoto(data);
      if (res.success) {
        const nextPhoto = res?.data?.profilePicture || photoPreview;
        setPhotoPreview(nextPhoto);
        login({ ...user, profilePicture: nextPhoto }, localStorage.getItem('token'));
        setMessage({ type: 'success', text: t('Profile photo updated!') });
        setSelectedFile(null);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || t('Photo upload failed') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-profile-container animate-fade-in">
      <div className="profile-header-strip">
        <div className="header-intel">
          <h2>My Profile</h2>
          <p>{t('Manage your account credentials and system preferences.')}</p>
        </div>
        {message.text && (
          <div className={`status-alert ${message.type}`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      <div className="profile-grid">
        {/* Sidebar: Profile Photo */}
        <div className="profile-card-sidebar">
          <div className="photo-management">
            <div className="auth-avatar">
              <img src={photoPreview || '/default-avatar.png'} alt="Profile" />
              <label className="photo-upload-overlay">
                <Camera size={24} />
                <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
              </label>
            </div>
            <div className="user-meta">
              <h3>{user?.firstName} {user?.lastName}</h3>
              <span className="role-chip">{t('Administrator')}</span>
            </div>
            {selectedFile && (
              <button className="btn-emerald full-width" onClick={uploadPhoto} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={16} /> : t('Save New Photo')}
              </button>
            )}
          </div>

          <div className="security-badges">
            <div className="badge-item">
              <ShieldCheck size={20} className="text-emerald-500" />
              <div>
                <span className="b-tit">Secure Session</span>
                <span className="b-desc">{t('Encrypted End-to-End')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Info & Password */}
        <div className="profile-settings-main">
          <div className="settings-card">
            <div className="card-header">
              <User size={20} />
              <span>{t('Personal Information')}</span>
            </div>
            <form onSubmit={handleProfileUpdate} className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    value={profileForm.firstName} 
                    onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    value={profileForm.lastName} 
                    onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>System Email Address</label>
                <div className="readonly-input">
                  <Mail size={16} />
                  <span>{profileForm.email}</span>
                </div>
                <p className="field-hint">{t('Email cannot be changed by the user for security auditing.')}</p>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-emerald" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> {t('Save Changes')}</>}
                </button>
              </div>
            </form>
          </div>

          <div className="settings-card">
            <div className="card-header">
              <Lock size={20} />
              <span>{t('Security & Password')}</span>
            </div>
            <form onSubmit={handlePasswordUpdate} className="settings-form">
              <div className="form-group">
                <label>Current Password</label>
                <div className="input-with-icon">
                  <Key size={16} />
                  <input 
                    type="password" 
                    placeholder={t('Enter current password')} 
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    placeholder={t('Minimal 8 chars')}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    placeholder={t('Repeat password')}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-emerald" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : t('Update Password')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, login } = useAuth();
  const { t } = useAppSettings();

  if (!user) {
    return (
      <div className="admin-loader-container">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p>{t('loadingSettings')}</p>
      </div>
    );
  }

  return <AdminProfileContent key={user._id || user.email} user={user} login={login} />;
};

export default Profile;
