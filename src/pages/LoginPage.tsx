import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { HomeHeader } from '../components/HomeHeader';
import { useAuth, getDashboardPathForRole } from '../context/AuthContext';
import { authApi } from '../services/api';
import logoImg from '../assets/images/desi_ride_logo.png';
import { AUTH_ASSETS } from '../utils/assetLibrary';

export const LoginPage: React.FC = () => {
  const { login, navigate } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset' | 'done'>('request');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please enter your Email Address or Mobile Number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await login({
        identifier: identifier.trim(),
        password,
        remember_me: rememberMe,
      });

      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');

      if (redirectParam && profile.role === 'customer') {
        navigate(redirectParam);
      } else {
        navigate(getDashboardPathForRole(profile.role));
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please check your email/mobile and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email or mobile number.');
      return;
    }
    try {
      const res = await authApi.forgotPassword(forgotIdentifier.trim());
      setForgotMessage(res.message || 'Verification code sent! Use OTP 123456 to reset.');
      setForgotStep('reset');
    } catch (err: any) {
      setForgotError(err.message || 'Account not found.');
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotOtp.trim() || forgotNewPassword.length < 6) {
      setForgotError('Enter a valid OTP and a new password (min 6 characters).');
      return;
    }
    try {
      const res = await authApi.resetPassword({
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        new_password: forgotNewPassword,
      });
      setForgotMessage(res.message || 'Password updated successfully! You can now log in.');
      setForgotStep('done');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="app-layout-root">
      <HomeHeader currentLocation="Gadwal, Telangana" onSelectLocation={() => {}} />

      <main className="auth-page-wrapper">
        <div className="auth-card-container">
          <div className="auth-card-header">
            <img src={logoImg} alt="Desi Ride" className="auth-logo" />
            <h1 className="auth-title">Welcome Back to Desi Ride</h1>
            <p className="auth-subtitle">
              Sign in with your Email or Mobile Number. You will be automatically directed to your role dashboard.
            </p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field-group">
              <label htmlFor="login-identifier" className="auth-label">
                Email or Mobile Number
              </label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="login-identifier"
                  type="text"
                  className="auth-input"
                  placeholder="Enter email or 10-digit mobile number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label htmlFor="login-password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-options-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                className="auth-forgot-link"
                onClick={() => {
                  setForgotStep('request');
                  setForgotError(null);
                  setForgotMessage(null);
                  setIsForgotOpen(true);
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="auth-primary-btn"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Signing In...' : 'Login'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-divider">
            <span>New to Desi Ride?</span>
          </div>

          <button
            type="button"
            className="auth-secondary-btn"
            onClick={() => navigate('/register')}
          >
            Register Now
          </button>

          <div className="auth-security-note">
            <ShieldCheck size={16} color="#08783F" />
            <span>Protected by JWT Authentication & Role-Based Access Control</span>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="modal-backdrop" onClick={() => setIsForgotOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3 className="sheet-title">Reset Your Password</h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsForgotOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div className="auth-alert auth-alert-error" style={{ marginBottom: '12px' }}>
                <AlertCircle size={16} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMessage && (
              <div className="auth-alert auth-alert-success" style={{ marginBottom: '12px' }}>
                <CheckCircle2 size={16} />
                <span>{forgotMessage}</span>
              </div>
            )}

            {forgotStep === 'request' && (
              <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                  <img
                    src={AUTH_ASSETS.forgotPassword}
                    alt="Forgot Password Verification"
                    style={{ width: '92px', height: '70px', objectFit: 'contain' }}
                  />
                </div>
                <p style={{ fontSize: '13px', color: '#4B5563' }}>
                  Enter your registered Email Address or Mobile Number to receive a password reset OTP.
                </p>
                <input
                  type="text"
                  className="auth-input-plain"
                  placeholder="Email or Mobile Number"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  required
                />
                <button type="submit" className="auth-primary-btn">
                  Send Reset OTP
                </button>
              </form>
            )}

            {forgotStep === 'reset' && (
              <form onSubmit={handleConfirmReset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  className="auth-input-plain"
                  placeholder="Enter 6-digit OTP (e.g. 123456)"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="auth-input-plain"
                  placeholder="Enter new strong password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  required
                />
                <button type="submit" className="auth-primary-btn">
                  Update Password
                </button>
              </form>
            )}

            {forgotStep === 'done' && (
              <button
                type="button"
                className="auth-primary-btn"
                onClick={() => setIsForgotOpen(false)}
              >
                Back to Login
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

