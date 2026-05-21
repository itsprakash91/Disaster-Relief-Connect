import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Donate() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ name: "", message: "" });
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [verified, setVerified] = useState(false);

  // Load Razorpay payment button script once
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.setAttribute("data-payment_button_id", "pl_RaqMFnYYjdZSDK");
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);

    const container = document.getElementById("razorpay-button-container");
    container.innerHTML = ""; // clear any duplicate instance before appending
    container.appendChild(script);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleVerify = () => {
    setVerified(true);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
      <h2 className="text-2xl font-semibold text-green-700 mb-4 text-center">
        Make a Donation
      </h2>

      <p className="text-gray-600 text-sm text-center mb-6">
        Your small act of kindness helps flood victims rebuild their lives 🙏
      </p>

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800 text-center">
          Please{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 underline"
          >
            login
          </button>{" "}
          to make a donation
        </div>
      )}

      {/* Simple Info Form */}
      <form className="space-y-4">
        <input
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />

        <textarea
          name="message"
          placeholder="Your message (optional)"
          value={form.message}
          onChange={handleChange}
          className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
          rows="3"
        />
      </form>

      {/* Verify Button */}
      {/* <div className="mt-6 text-center">
        {!verified ? (
          <button
            onClick={handleVerify}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Verify
          </button>
        ) : (
          <div className="w-full py-3 bg-green-100 text-green-700 font-semibold rounded-lg">
            ✅ Verified
          </div>
        )}
      </div> */}

      {/* Razorpay Donation Button Section */}
      <div
        id="razorpay-button-container"
        className="mt-6 text-center border-t pt-4"
      >
        {razorpayLoaded ? (
          <p className="text-gray-600 text-sm mb-3">
            Click below to complete your donation securely via Razorpay
          </p>
        ) : (
          <p className="text-gray-400 text-sm">Loading donation gateway...</p>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
}
