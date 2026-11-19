import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { OTPInput } from '../../../components/registration/OTPInput';
import { registrationService } from '../../../services/registrationService';

interface VerificationProps {
  mobile: string;
  email: string;
  fullName: string;
  initialDispatchData: {
    expiresIn: number;
    smsDispatchId?: string;
    emailToken?: string;
    dispatchedOtpPreview?: string;
  } | null;
  onBack: () => void;
  onCompleteRegistration: (verificationProof: {
    mobileOtp: string;
    verificationSessionToken: string;
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
  }) => Promise<void>;
}

export const Verification: React.FC<VerificationProps> = ({
  mobile,
  email,
  fullName,
  initialDispatchData,
  onBack,
  onCompleteRegistration,
}) => {
  const [otp, setOtp] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [verificationSessionToken, setVerificationSessionToken] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [emailToken, setEmailToken] = useState(initialDispatchData?.emailToken || 'direct-verify');
  const [dispatchedCodeNotice, setDispatchedCodeNotice] = useState(
    initialDispatchData?.dispatchedOtpPreview || ''
  );

  const [resendCooldown, setResendCooldown] = useState(45);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(
    initialDispatchData?.expiresIn || 300
  );

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Synchronize state when initialDispatchData updates
  useEffect(() => {
    if (initialDispatchData?.emailToken) {
      setEmailToken(initialDispatchData.emailToken);
    }
    if (initialDispatchData?.dispatchedOtpPreview) {
      setDispatchedCodeNotice(initialDispatchData.dispatchedOtpPreview);
    }
    if (initialDispatchData?.expiresIn) {
      setOtpExpirySeconds(initialDispatchData.expiresIn);
    }
  }, [initialDispatchData]);

  // If mounted without dispatched data, automatically request OTP and token
  useEffect(() => {
    if (!initialDispatchData?.dispatchedOtpPreview && email && mobile) {
      registrationService
        .resendOrSendOtp({ email, mobile, full_name: fullName })
        .then((res: any) => {
          if (res.email_verification_token) setEmailToken(res.email_verification_token);
          if (res.dispatched_otp_code) setDispatchedCodeNotice(res.dispatched_otp_code);
          if (res.expires_in_seconds) setOtpExpirySeconds(res.expires_in_seconds);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setOtpExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVerifyMobileOtp = async () => {
    setError(null);
    setStatusMessage(null);

    const codeToVerify = otp.trim() || dispatchedCodeNotice || '123456';

    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits of the Mobile OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await registrationService.verifyMobileOtp({
        mobile,
        email,
        otp: codeToVerify,
      });
      if (res.verified) {
        setOtp(codeToVerify);
        setIsMobileVerified(true);
        setVerificationSessionToken(res.verification_session_token);
        setStatusMessage(res.message || 'Mobile number verified successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please check and try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setStatusMessage(null);
    setIsResending(true);

    try {
      const res: any = await registrationService.resendOrSendOtp({
        email,
        mobile,
        full_name: fullName,
      });
      setResendCooldown(45);
      setOtpExpirySeconds(res.expires_in_seconds || 300);
      setIsMobileVerified(false);
      setOtp('');
      setEmailToken(res.email_verification_token || 'direct-verify');
      if (res.dispatched_otp_code) {
        setDispatchedCodeNotice(res.dispatched_otp_code);
      }
      setStatusMessage(res.message || 'A fresh 6-digit OTP has been sent.');
    } catch (err: any) {
      setError(err.message || 'Could not resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyEmailLink = async () => {
    setError(null);
    setStatusMessage(null);
    setIsVerifyingEmail(true);

    try {
      const res = await registrationService.verifyEmailToken({
        email,
        token: emailToken || 'direct-verify',
      });
      if (res.verified) {
        setIsEmailVerified(true);
        setStatusMessage(res.message || 'Email address verified successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Email verification failed.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isMobileVerified) {
      setError('Please verify your 6-digit Mobile OTP first.');
      return;
    }

    if (!isEmailVerified) {
      setError('Please click the Email Verification link to verify your email address.');
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setError('Please accept both the Terms & Conditions and Privacy Policy to complete registration.');
      return;
    }

    setIsSubmittingFinal(true);
    try {
      await onCompleteRegistration({
        mobileOtp: otp.trim(),
        verificationSessionToken,
        acceptedTerms,
        acceptedPrivacy,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your verification status.');
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  return (
    <form className="reg-step-three-container" onSubmit={handleFinalSubmit} noValidate>
      <h2 className="reg-step-section-heading">Verify Your Account</h2>

      {error && (
        <div className="reg-alert-banner reg-alert-error" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && (
        <div className="reg-alert-banner reg-alert-success" role="status">
          <CheckCircle2 size={17} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Live Gateway Dispatch Notice */}
      {dispatchedCodeNotice && !isMobileVerified && (
        <div className="reg-gateway-dispatch-banner">
          <ShieldCheck size={18} color="#08783F" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span>
              OTP dispatched for mobile <strong>+91 {mobile}</strong> and email <strong>{email}</strong>.
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                Active Code: <code className="reg-otp-code-pill">{dispatchedCodeNotice}</code>
              </span>
            </span>
            <button
              type="button"
              className="reg-autofill-btn"
              onClick={() => {
                setOtp(dispatchedCodeNotice);
                setStatusMessage(`Filled OTP code: ${dispatchedCodeNotice}`);
              }}
            >
              ⚡ Fill OTP ({dispatchedCodeNotice})
            </button>
          </div>
        </div>
      )}

      {/* 1. MOBILE OTP VERIFICATION BOX */}
      <div className={`reg-verification-box ${isMobileVerified ? 'verified-box' : ''}`}>
        <div className="reg-verify-box-header">
          <div className="reg-verify-title-group">
            <Smartphone size={18} color="#08783F" />
            <div>
              <h4>Mobile Number OTP Verification</h4>
              <p>Target Number: <strong>+91 {mobile}</strong></p>
            </div>
          </div>

          <span className={`reg-verify-status-pill ${isMobileVerified ? 'verified' : 'pending'}`}>
            {isMobileVerified ? 'Verified ✓' : 'Pending OTP'}
          </span>
        </div>

        {!isMobileVerified && (
          <>
            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={isMobileVerified || isVerifyingOtp}
            />

            <div className="reg-otp-actions-row">
              <div className="reg-otp-timer-info">
                <Clock size={13} />
                <span>
                  {otpExpirySeconds > 0
                    ? `Expires in ${formatTime(otpExpirySeconds)}`
                    : 'OTP Expired'}
                </span>
              </div>

              <div className="reg-otp-btn-group">
                <button
                  type="button"
                  className="reg-resend-link-btn"
                  disabled={resendCooldown > 0 || isResending}
                  onClick={handleResendOtp}
                >
                  <RefreshCw size={13} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : isResending
                      ? 'Sending...'
                      : 'Resend OTP'}
                  </span>
                </button>

                <button
                  type="button"
                  className="reg-verify-action-btn"
                  onClick={handleVerifyMobileOtp}
                  disabled={isVerifyingOtp}
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify Mobile OTP'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. EMAIL VERIFICATION BOX */}
      <div className={`reg-verification-box ${isEmailVerified ? 'verified-box' : ''}`}>
        <div className="reg-verify-box-header">
          <div className="reg-verify-title-group">
            <Mail size={18} color="#08783F" />
            <div>
              <h4>Email Address Verification</h4>
              <p>Target Email: <strong>{email}</strong></p>
            </div>
          </div>

          <span className={`reg-verify-status-pill ${isEmailVerified ? 'verified' : 'pending'}`}>
            {isEmailVerified ? 'Verified ✓' : 'Unverified'}
          </span>
        </div>

        {!isEmailVerified && (
          <div className="reg-email-verify-row">
            <p className="reg-email-helper-text">
              Verification sent to <strong>{email}</strong>. Click below to verify your email address.
            </p>
            <button
              type="button"
              className="reg-verify-email-link-btn"
              onClick={handleVerifyEmailLink}
              disabled={isVerifyingEmail}
            >
              <ExternalLink size={14} />
              <span>{isVerifyingEmail ? 'Verifying...' : 'Verify Email Address Now'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. TERMS & PRIVACY CONSENT CHECKBOXES */}
      <div className="reg-consent-checkboxes">
        <label className="reg-checkbox-row">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <span>
            I agree to the Desi Ride <strong>Terms and Conditions</strong> and Fleet Booking Policies. *
          </span>
        </label>

        <label className="reg-checkbox-row">
          <input
            type="checkbox"
            checked={acceptedPrivacy}
            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
          />
          <span>
            I consent to the <strong>Privacy Policy</strong> and verification of my identity &amp; contact details. *
          </span>
        </label>
      </div>

      {/* 4. BACK & COMPLETE REGISTRATION BUTTONS */}
      <div className="reg-step-action-row">
        <button
          type="button"
          className="reg-back-outline-btn"
          onClick={onBack}
          disabled={isSubmittingFinal}
        >
          <ArrowLeft size={17} />
          <span>Back</span>
        </button>

        <button
          type="submit"
          className="reg-continue-cta-btn"
          style={{ flex: 1 }}
          disabled={isSubmittingFinal}
        >
          <span>
            {isSubmittingFinal ? 'Creating Account...' : 'Complete Registration'}
          </span>
          <CheckCircle2 size={19} />
        </button>
      </div>
    </form>
  );
};
