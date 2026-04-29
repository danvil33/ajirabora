// src/components/AjiraBoraAI.jsx
import React, { useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { FaStar, FaCheckCircle } from "react-icons/fa";

const AjiraBoraAI = ({ jobId, jobTitle }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const openAI = async () => {
    if (!user) {
      alert("Please login to use AjiraBora AI");
      window.location.href = "/login";
      return;
    }

    if (!jobId) {
      alert("Job ID missing. Please refresh.");
      return;
    }

    setLoading(true);

    // Create the prompt message
    const message = `Analyze jobId: ${jobId} for userId: ${user.uid}`;
    
    // Encode and create URL with ?prompt= parameter
    const encodedMessage = encodeURIComponent(message);
    const gptUrl = `https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai?prompt=${encodedMessage}`;

    // Copy to clipboard as backup
    await navigator.clipboard.writeText(message);
    
    // Show modal and open GPT
    setShowModal(true);
    window.open(gptUrl, "_blank");

    setLoading(false);
  };

  return (
    <>
      <button
        onClick={openAI}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-[#FF8C00] text-[#FF8C00] rounded-lg hover:bg-[#FF8C00] hover:text-white transition-colors font-medium"
      >
        <FaStar className="text-[#FF8C00] group-hover:text-white" />
        {loading ? "Preparing AI..." : "Analyze with AjiraBora AI"}
      </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm text-center shadow-xl animate-fadeIn">
            <div className="w-16 h-16 bg-[#FF8C00]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaStar className="text-3xl text-[#FF8C00]" />
            </div>
            <h2 className="text-lg font-bold text-[#1A2A4A]">
              AjiraBora AI Ready
            </h2>

            <p className="text-sm text-gray-600 mt-2">
              Your analysis request has been prepared!
            </p>

            <div className="mt-4 text-sm text-green-600 font-semibold flex items-center justify-center gap-2">
              <FaCheckCircle />
              Message pre-filled in ChatGPT
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Just press <strong>Enter</strong> to analyze your match
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 text-sm rounded-lg bg-[#1A2A4A] text-white hover:bg-[#2a3d6e] transition w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default AjiraBoraAI;