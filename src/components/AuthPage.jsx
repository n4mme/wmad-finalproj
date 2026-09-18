import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebase';
import BiyaHeleCombinedLogo from './BiyaHeleCombinedLogo.png';
import VerificationPopup from './VerificationPopup.jsx';

const googleProvider = new GoogleAuthProvider();

// Initialize EmailJS
emailjs.init('F0NOLhwaqVJSlllOF');

// --- Icons ---
const EyeIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 .946-3.118 3.55-5.604 6.84-6.682M6.75 6.75A5.25 5.25 0 0112 4.5c1.655 0 3.18.835 4.125 2.125m0 0A5.25 5.25 0 0117.25 12 5.25 5.25 0 0112 17.25c-.896 0-1.73-.24-2.458-.658M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Handle initial view based on navigation state
  useEffect(() => {
    if (location.state?.defaultView) {
      setIsLoginView(location.state.defaultView === 'login');
    }
  }, [location.state]);
  
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  
  // OTP States
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [pendingUserData, setPendingUserData] = useState(null);

  // Generate and Send OTP via EmailJS - Optimized for fast delivery
  const sendOtpEmail = async (userEmail, userName = '', retryCount = 0) => {
    // Validate email format immediately before sending
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setError('Invalid email format. Please check your email address.');
      setIsSendingOTP(false);
      return;
    }

    setIsSendingOTP(true);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otpCode);

    const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString();

    // Prepare template params immediately
    const templateParams = {
      to_email: userEmail,
      to_name: userName || 'User',
      passcode: otpCode,
      time: expiryTime
    };

    // Helper function to send email with timeout
    const sendEmailWithTimeout = (timeoutMs = 10000) => {
      return Promise.race([
        emailjs.send(
          'service_pj8jk8q',
          'template_b72y565',
          templateParams,
          'F0NOLhwaqVJSlllOF'
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout. Please try again.')), timeoutMs)
        )
      ]);
    };

    try {
      // Send email immediately with timeout protection
      const response = await sendEmailWithTimeout(10000);
      
      // Success - update UI immediately
      setError('');
      setIsSendingOTP(false);
      setShowVerificationPopup(true);
      
      console.log("OTP sent successfully to:", userEmail);
    } catch (err) {
      console.error("EmailJS Error:", err);
      
      // Retry mechanism - retry once immediately if first attempt fails
      if (retryCount === 0 && !err.message?.includes('timeout')) {
        console.log("Retrying OTP send...");
        // Retry immediately without delay
        return sendOtpEmail(userEmail, userName, 1);
      }
      
      setIsSendingOTP(false);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (err.text) {
        errorMessage = err.text;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Check if it's a template configuration issue
      if (errorMessage.includes('recipients address is empty')) {
        errorMessage = 'EmailJS template error: Please configure the "To email" field in your EmailJS template to use {{to_email}}';
      }
      
      setError(errorMessage);
    }
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const user = userCredential.user;
      
      // Check Firestore for email verification status (OTP verification)
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        setLoginError("Account not found. Please register first.");
        await auth.signOut();
        return;
      }
      
      const userData = userDoc.data();
      
      if (!userData.emailVerified && !userData.otpVerified) {
        setLoginError("Please verify your email using the OTP sent during registration.");
        await auth.signOut();
        return;
      }
      
      // Update last login timestamp
      try {
        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating last login:", error);
      }
      
      // Successfully logged in - App.js will redirect to the appropriate dashboard based on role
      console.log("Login successful! Redirecting to dashboard...");
    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setLoginError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setLoginError("Too many failed login attempts. Please try again later.");
      } else {
        setLoginError("Login failed. Please try again.");
      }
    }
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setPopupMessage('');

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (!role) {
      setError("Please select a role.");
      return;
    }
    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }
    if (!dateOfBirth) {
      setError("Please enter your date of birth.");
      return;
    }
    if (!mobileNumber) {
      setError("Please enter your mobile number.");
      return;
    }

    // Store user data temporarily
    setPendingUserData({
      email,
      password,
      fullName,
      dateOfBirth,
      mobileNumber,
      role
    });

    // Send OTP
    await sendOtpEmail(email, fullName);
  };

  // Verify OTP & Create Account
  const handleVerifyOtp = async () => {
    if (otp === generatedOtp) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, pendingUserData.email, pendingUserData.password);
        const user = userCredential.user;

        // Save user data to Firestore with emailVerified: true (since OTP was verified)
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          fullName: pendingUserData.fullName,
          dateOfBirth: pendingUserData.dateOfBirth,
          mobileNumber: pendingUserData.mobileNumber,
          role: pendingUserData.role,
          emailVerified: true, // Set to true since OTP verification is complete
          otpVerified: true,
          createdAt: new Date(),
        });

        setShowVerificationPopup(false);
        setPopupMessage("Account created successfully! You can now log in with your credentials.");
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setDateOfBirth('');
        setMobileNumber('');
        setRole('');
        setPendingUserData(null);
        setOtp('');
        
        // Switch to login view after 3 seconds
        setTimeout(() => {
          setPopupMessage('');
          setIsLoginView(true);
        }, 3000);
      } catch (err) {
        console.error("Error creating user:", err);
        setError("Account creation failed. Please try again.");
        setShowVerificationPopup(false);
      }
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (pendingUserData) {
      await sendOtpEmail(pendingUserData.email, pendingUserData.fullName);
    }
  };

  // Google Sign-In (works for both login and registration)
  const handleGoogleSignIn = async () => {
    setLoginError('');
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document already exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // New user - create account with Google
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || '',
          photoURL: user.photoURL,
          role: 'guest', // Default role for Google sign-up
          emailVerified: true, // Google accounts are pre-verified
          otpVerified: true,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
        console.log("New user registered with Google");
      } else {
        // Existing user - just sign in
        // Update last login time or any other fields if needed
        await setDoc(userDocRef, {
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          lastLogin: serverTimestamp(),
        }, { merge: true });
        console.log("Existing user signed in with Google");
      }

      // Successfully signed in/up with Google - App.js will handle redirection
    } catch (error) {
      const errorMessage = isLoginView 
        ? "Could not sign in with Google. Please try again."
        : "Could not sign up with Google. Please try again.";
      
      if (isLoginView) {
        setLoginError(errorMessage);
      } else {
        setError(errorMessage);
      }
      console.error("Google Sign-In Error", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          {/* Logo - Clickable to go back to Landing Page */}
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <img
              src={BiyaHeleCombinedLogo}
              alt="BiyaHele Logo"
                            className="h-12 sm:h-16 md:h-20 w-auto"
            />
          </div>

          {/* Login / Sign Up Buttons */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setIsLoginView(true)}
              data-testid="auth-tab-login"
                            className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${
                isLoginView
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-teal-500'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLoginView(false)}
              data-testid="auth-tab-signup"
                            className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${
                !isLoginView
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-teal-500'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Main Auth Container with Slider Animation */}
            <div className="flex-1 flex justify-center items-center p-2 sm:p-4 md:p-8">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden" style={{ minHeight: '500px' }}>
        
                {/* Slider Background - Hidden on mobile, shown on lg+ */}
        <div 
                    className={`hidden lg:block absolute top-0 h-full w-1/2 bg-gradient-to-br from-teal-400 to-blue-500 transition-all duration-700 ease-in-out z-30 ${
            isLoginView ? 'left-1/2 rounded-l-3xl' : 'left-0 rounded-r-3xl'
          }`}
        >
          <div className="flex flex-col items-center justify-center h-full text-white p-8 relative z-40">
            <h2 className="text-4xl font-bold mb-4">
              {isLoginView ? 'New Here?' : 'Welcome Back!'}
            </h2>
            <p className="text-center mb-6 opacity-90">
              {isLoginView 
                ? 'Sign up and discover a great amount of new opportunities!'
                : 'To keep connected with us please login with your personal info'}
            </p>
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setError('');
                setLoginError('');
              }}
              className="border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-teal-500 transition-all duration-300 relative z-50"
            >
              {isLoginView ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Forms Container */}
        <div className="relative z-20 flex h-full">
          {/* Login Form */}
          <div 
                        className={`w-full lg:w-1/2 p-6 sm:p-8 md:p-12 transition-all duration-700 ${
                            isLoginView ? 'opacity-100' : 'opacity-0 pointer-events-none absolute lg:relative'
            }`}
          >
            {/* Logo at top center of white form area */}
            <div className="flex justify-center mb-8">
              <div 
                className="cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => navigate('/')}
              >
                <img
                  src={BiyaHeleCombinedLogo}
                  alt="BiyaHele Logo"
                  className="h-20 w-auto"
                  style={{ mixBlendMode: 'darken', backgroundColor: 'transparent' }}
                />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-6">Sign In</h2>
            
            {loginError && (
              <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-lg mb-4">{loginError}</p>
            )}

            <form className="space-y-4" onSubmit={handleLogin} data-testid="login-form">
              <input
                type="email"
                placeholder="Email address"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                data-testid="login-email-input"
                className="w-full pl-4 pr-3 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                required
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  data-testid="login-password-input"
                  className="w-full pl-4 pr-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-teal-500 hover:underline">Forgot Password?</a>
              </div>

              <button
                type="submit"
                data-testid="login-submit-button"
                className="w-full bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-teal-500 hover:to-blue-600 transform hover:scale-105 transition-all"
              >
                Sign In
              </button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-grow bg-gray-200 h-px"></div>
              <span className="mx-4 text-sm text-gray-400">Or</span>
              <div className="flex-grow bg-gray-200 h-px"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              data-testid="google-signin-button"
              className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google logo" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Register Form */}
          <div 
                        className={`w-full lg:w-1/2 p-6 sm:p-8 md:p-12 transition-all duration-700 overflow-y-auto ${
                            isLoginView ? 'opacity-0 pointer-events-none absolute lg:relative' : 'opacity-100'
            }`}
            style={{ maxHeight: '600px' }}
            data-testid="signup-form-container"
          >
            {/* Logo at top center of white form area */}
            <div className="flex justify-center mb-8">
              <div 
                className="cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => navigate('/')}
              >
                <img
                  src={BiyaHeleCombinedLogo}
                  alt="BiyaHele Logo"
                  className="h-20 w-auto"
                  style={{ mixBlendMode: 'darken', backgroundColor: 'transparent' }}
                />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-6">Sign Up</h2>
            
            {error && (
              <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-lg mb-4">{error}</p>
            )}

            <form className="space-y-3" onSubmit={handleRegister} data-testid="signup-form">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                data-testid="signup-fullname-input"
                className="w-full pl-4 pr-3 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                required
              />

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="signup-email-input"
                className="w-full pl-4 pr-3 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                required
              />

              <input
                type="tel"
                placeholder="Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                data-testid="signup-mobile-input"
                className="w-full pl-4 pr-3 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                required
              />

              <input
                type="date"
                placeholder="Date of Birth"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                data-testid="signup-dob-input"
                className="w-full pl-4 pr-3 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                required
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                data-testid="signup-role-select"
                className="w-full pl-3 pr-3 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                required
              >
                <option value="" disabled>Select your role</option>
                <option value="guest">Guest</option>
                <option value="host">Host</option>
              </select>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="signup-password-input"
                  className="w-full pl-4 pr-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="signup-confirm-password-input"
                className="w-full pl-4 pr-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                required
              />

              <button
                type="submit"
                disabled={isSendingOTP}
                data-testid="signup-submit-button"
                className={`w-full bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-teal-500 hover:to-blue-600 transform hover:scale-105 transition-all ${
                  isSendingOTP ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSendingOTP ? 'Sending OTP...' : 'Sign Up'}
              </button>
            </form>

            <div className="flex items-center my-3">
              <div className="flex-grow bg-gray-200 h-px"></div>
              <span className="mx-4 text-sm text-gray-400">Or</span>
              <div className="flex-grow bg-gray-200 h-px"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              data-testid="google-signup-button"
              className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google logo" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Verification Popup */}
      {showVerificationPopup && (
        <VerificationPopup
          otpInput={otp}
          setOtpInput={setOtp}
          onResend={handleResendOtp}
          onVerify={handleVerifyOtp}
          onClose={() => setShowVerificationPopup(false)}
        />
      )}

      {/* Success Popup */}
      {popupMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
          <div className="bg-white rounded-2xl p-6 shadow-2xl text-center max-w-sm w-full">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-teal-600 mb-2">Success</h2>
            <p className="text-gray-700 mb-4">{popupMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

