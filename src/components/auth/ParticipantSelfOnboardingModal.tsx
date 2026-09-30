import React, { useState } from 'react';
import { Study, Site } from '../../types';
import { identityDeliveryService } from '../../services/identityDeliveryService';
import { authService } from '../../services/authService';
import { participantService } from '../../services/participantService';
import {
  X,
  UserPlus,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface ParticipantSelfOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  studies: Study[];
  sites: Site[];
  onRegistrationComplete?: (email: string) => void;
}

export const ParticipantSelfOnboardingModal: React.FC<ParticipantSelfOnboardingModalProps> = ({
  isOpen,
  onClose,
  studies,
  sites,
  onRegistrationComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [selectedStudyId, setSelectedStudyId] = useState(studies[0]?.id || 'STUDY-001');
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || 'SITE-001');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [notes, setNotes] = useState('');

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpHint, setOtpHint] = useState<string | null>(null);

  // Password State
  const [password, setPassword] = useState('128');
  const [confirmPassword, setConfirmPassword] = useState('128');

  // UI States
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ email: string; requestId: string } | null>(null);

  if (!isOpen) return null;

  // Filter sites for the selected study
  const selectedStudy = studies.find((s) => s.id === selectedStudyId);
  const studySites = selectedStudy?.sites || [];

  // Step 1 -> Step 2: Validate demographics and issue synthetic challenge
  const handleProceedToOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('A valid email address is required.');
      return;
    }

    try {
      setIsProcessing(true);
      const challenge = await identityDeliveryService.requestChallenge(
        email.trim().toLowerCase(),
        'ONBOARDING'
      );

      setOtpHint(challenge.code || '654321');
      setStep(2);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send challenge code.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 -> Step 3: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpCode.trim()) {
      setErrorMessage('Please enter the 6-digit challenge code.');
      return;
    }

    try {
      setIsProcessing(true);
      const isVerified = await identityDeliveryService.verifyChallenge(
        email.trim().toLowerCase(),
        otpCode.trim()
      );
      if (!isVerified) {
        setErrorMessage('Invalid verification code. Please enter 654321.');
        return;
      }

      setStep(3);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3 -> Step 4: Set password & submit onboarding
  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password || password.length < 3) {
      setErrorMessage('Password must be at least 3 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setIsProcessing(true);

      // 1. Create participant user account
      const newUser = await authService.registerParticipantUser({
        email: email.trim().toLowerCase(),
        name: fullName.trim(),
        password,
        studyId: selectedStudyId,
        siteId: selectedSiteId,
      });

      // 2. Submit onboarding request to CRC queue
      const req = await participantService.createOnboardingRequest({
        studyId: selectedStudyId,
        siteId: selectedSiteId,
        requestedEmail: email.trim().toLowerCase(),
        requestedName: fullName.trim(),
        age: age ? Number(age) : undefined,
        dob: dob || undefined,
        gender,
        phone: phone.trim() || undefined,
        preferredLanguage,
        notes: notes.trim() || undefined,
        participantAccountId: newUser.id,
      });

      setSuccessInfo({ email: email.trim().toLowerCase(), requestId: req.id });
      setStep(4);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    if (successInfo && onRegistrationComplete) {
      onRegistrationComplete(successInfo.email);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <div className="bg-white rounded-sm shadow-xl max-w-lg w-full border border-neutral-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-300" />
            <h2 id="onboarding-modal-title" className="font-serif font-semibold text-lg">
              Participant Self-Onboarding
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-emerald-50 px-6 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs font-medium text-emerald-900">
          <span className={step === 1 ? 'font-bold underline' : ''}>1. Demographics</span>
          <span>&rarr;</span>
          <span className={step === 2 ? 'font-bold underline' : ''}>2. Identity Verification</span>
          <span>&rarr;</span>
          <span className={step === 3 ? 'font-bold underline' : ''}>3. Password Setup</span>
          <span>&rarr;</span>
          <span className={step === 4 ? 'font-bold underline' : ''}>4. Complete</span>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Demographics & Study Selection */}
          {step === 1 && (
            <form onSubmit={handleProceedToOtp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Clinical Study <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedStudyId}
                    onChange={(e) => {
                      setSelectedStudyId(e.target.value);
                      const matching = studies.find((s) => s.id === e.target.value);
                      if (matching && matching.sites.length > 0) setSelectedSiteId(matching.sites[0].id);
                    }}
                    className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    {studies.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.code} — {st.title.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Study Site <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    {studySites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.siteCode} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Sharma"
                  required
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="participant@example.test"
                    required
                    className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 42"
                    className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                    className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Sanskrit">Sanskrit (संस्कृतम्)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Applicant Statement / Clinical Concerns
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Describe your health symptoms, medical history, or reason for enrolling in this trial..."
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-neutral-700 border border-neutral-300 rounded-sm hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-sm disabled:opacity-50"
                >
                  {isProcessing ? 'Validating...' : 'Next: Identity Verification'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Local Test Challenge Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-sm text-teal-900 text-sm space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-5 h-5 text-teal-700" />
                  <span>Offline Identity Challenge Verification</span>
                </div>
                <p className="text-xs text-teal-800">
                  In this offline trial environment, identity verification is performed deterministically.
                  A test verification code has been dispatched to{' '}
                  <span className="font-semibold">{email}</span>.
                </p>
                {otpHint && (
                  <div className="p-2 bg-white rounded-xs border border-teal-200 text-xs font-mono font-bold text-center text-teal-950">
                    Test Verification Code: <span className="text-base text-emerald-700">{otpHint}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Enter 6-Digit Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="654321"
                  required
                  className="w-full text-center text-xl tracking-widest font-mono py-3 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-neutral-700 border border-neutral-300 rounded-sm hover:bg-neutral-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-sm disabled:opacity-50"
                >
                  {isProcessing ? 'Verifying...' : 'Verify Code & Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Password Setup */}
          {step === 3 && (
            <form onSubmit={handleSubmitOnboarding} className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-900 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <KeyRound className="w-5 h-5 text-emerald-700" />
                  <span>Create Participant Portal Password</span>
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  You will use your email (<span className="font-semibold">{email}</span>) and this
                  password to log in to the Participant Portal to track visits, requests, and study status.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. 128"
                  required
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[11px] text-neutral-500">
                  Default test password is pre-filled: 128
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-neutral-700 border border-neutral-300 rounded-sm hover:bg-neutral-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-sm disabled:opacity-50"
                >
                  {isProcessing ? 'Submitting Application...' : 'Submit Onboarding Application'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="font-serif font-bold text-xl text-neutral-900">
                Application Submitted Successfully!
              </h3>
              <p className="text-sm text-neutral-600 max-w-sm mx-auto">
                Your onboarding request has been dispatched to the Clinical Research Coordinator (CRC) queue.
                Your participant login account has been created for{' '}
                <span className="font-semibold text-neutral-900">{successInfo?.email}</span>.
              </p>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm text-xs text-neutral-700 text-left max-w-sm mx-auto space-y-1">
                <div>
                  <span className="text-neutral-500">Request ID:</span>{' '}
                  <span className="font-mono">{successInfo?.requestId}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Initial Status:</span>{' '}
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-xs font-semibold">
                    SUBMITTED (Pending CRC Review)
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Login Role:</span>{' '}
                  <span className="font-medium">Study Participant (ROLE_PARTICIPANT)</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-sm transition-colors"
                >
                  Return to Login & Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
