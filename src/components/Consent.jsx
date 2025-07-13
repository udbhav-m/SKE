import React from "react";
import { Router, useNavigate } from "react-router-dom";

function Consent({ setConsent }) {
  const navigate = useNavigate();
  function handleHome() {
    navigate("/home");
  }
  return (
    <>
      <div className="w-96 h-fit text-center space-y-3 bg-secondary rounded-md pb-3">
        <h1 className="font-semibold text-lg text-white rounded-t-md  bg-primary p-3">
          Consent Required
        </h1>
        <p className="text-sm p-3">
          By proceeding with this payment, you confirm your consent to provide
          your PAN and AADHAR details for verification purposes voluntarily, as
          required for this event. You affirm that all the information you have
          provided during registration and payment is accurate and truthful to
          the best of your knowledge. The system ensures that your personal
          data, including PAN and AADHAR details, will be securely stored and
          will not be shared with any third party, except as required by law.
        </p>
        <div>
          <button
            onClick={() => setConsent(true)}
            className="bg-primary px-6 py-2 rounded-full text-white"
          >
            I Consent
          </button>
          <button
            onClick={handleHome}
            className="text-custom-brown font-semibold px-6 py-2 rounded-full "
          >
            Decline
          </button>
        </div>
      </div>
    </>
  );
}

export default Consent;
