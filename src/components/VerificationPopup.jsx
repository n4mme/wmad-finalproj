import React from "react";
import "./VerificationPopup.css"; // optional if you want to style it

const VerificationPopup = ({
  otpInput,
  setOtpInput,
  onResend,
  onVerify,
  onClose,
}) => {
  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <h3>Email Verification</h3>
        <p>Enter the OTP sent to your email:</p>

        <input
          type="text"
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value)}
          placeholder="Enter OTP"
          className="popup-input"
        />

        <div className="popup-buttons">
          <button onClick={onResend} className="popup-resend">
            Resend OTP
          </button>
          <button onClick={onVerify} className="popup-verify">
            Verify Account
          </button>
        </div>

        <button onClick={onClose} className="popup-close">
          ×
        </button>
      </div>
    </div>
  );
};

export default VerificationPopup;
