// src/components/AjiraBoraAI.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { FaStar, FaCopy, FaExternalLinkAlt, FaCheckCircle } from "react-icons/fa";

const AjiraBoraAI = ({ jobId, jobTitle }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [usePromptParam, setUsePromptParam] = useState(true);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const openAI = async () => {
    if (!user) {
      alert("Please login to use AjiraBora AI");
      window.location.href = "/login";
      return;
    }

    if (!jobId) {
      alert("Job ID missing. Please refresh the page.");
      return;
    }

    setLoading(true);

    // Create the analysis message
    const message = `🎯 JOB ANALYSIS REQUEST

Please analyze this job for me:

Job ID: ${jobId}
Job Title: ${jobTitle}
User ID: ${user.uid}

Please:
1. Call analyzeJobMatch API with my userId and jobId
2. Compare my profile vs job requirements
3. Give me a match score (0-100%)
4. List my strengths and weaknesses for this role
5. Tell me if I should apply or not
6. If it's a good match, help me write a cover letter

Thank you!`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // GPT URL with prompt parameter
    const gptUrl = `https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai?prompt=${encodedMessage}`;
    
    // Also try these alternative URLs if prompt doesn't work
    const alternativeUrls = {
      qParam: `https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai?q=${encodedMessage}`,
      hashFragment: `https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai#${encodedMessage}`,
      textParam: `https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai?text=${encodedMessage}`,
      messageParam: `https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai?message=${encodedMessage}`,
    };

    try {
      // Copy to clipboard first (always reliable)
      await navigator.clipboard.writeText(message);
      setCopied(true);
      
      // Show modal with instructions
      setShowModal(true);
      
      // Try to open with prompt parameter
      const urlToUse = usePromptParam ? gptUrl : alternativeUrls.qParam;
      window.open(urlToUse, "_blank");
      
      // Reset copied status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard failed:", err);
      window.open(gptUrl, "_blank");
    }

    setLoading(false);
  };

  const copyOnly = async () => {
    const message = `Analyze jobId: ${jobId} for userId: ${user.uid}`;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInBrowser = () => {
    const message = `Analyze jobId: ${jobId} for userId: ${user.uid}`;
    navigator.clipboard.writeText(message);
    window.open("https://chat.openai.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai", "_blank");
    setShowModal(false);
  };

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={openAI}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-[#FF8C00] text-[#FF8C00] rounded-lg hover:bg-[#FF8C00] hover:text-white transition-colors font-medium"
      >
        <FaStar className="text-[#FF8C00] group-hover:text-white" />
        {loading ? "Preparing AI..." : "Analyze with AjiraBora AI"}
      </button>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-[#FF8C00]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaStar className="text-3xl text-[#FF8C00]" />
              </div>
              <h2 className="text-xl font-bold text-[#1A2A4A]">
                AjiraBora AI Ready
              </h2>
              <p className="text-gray-600 text-sm mt-2">
                Your job analysis request has been prepared
              </p>
            </div>

            {/* Success Message */}
            <div className={`bg-green-50 rounded-xl p-3 mb-4 flex items-center gap-3 transition-all ${copied ? 'opacity-100' : 'opacity-100'}`}>
              <FaCheckCircle className="text-green-600 text-lg" />
              <span className="text-green-700 text-sm font-medium">✓ Request copied to clipboard</span>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl p-4 mb-5">
              <p className="text-blue-800 text-sm font-semibold mb-3 flex items-center gap-2">
                <FaExternalLinkAlt className="text-xs" />
                How to complete your analysis:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-xs">1</div>
                  <span className="text-blue-700">AjiraBora AI is opening in a new tab</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-xs">2</div>
                  <span className="text-blue-700">Press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong> on Mac) to paste</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-xs">3</div>
                  <span className="text-blue-700">Press <strong>Enter</strong> to send</span>
                </div>
              </div>
            </div>

            {/* Try Prompt Parameter Toggle */}
            <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
              <label className="text-sm text-gray-600">Try ?prompt= parameter:</label>
              <button
                onClick={() => setUsePromptParam(!usePromptParam)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  usePromptParam 
                    ? 'bg-[#FF8C00] text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {usePromptParam ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={copyOnly}
                className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                <FaCopy />
                Copy Prompt Again
              </button>
              
              <button
                onClick={openInBrowser}
                className="flex items-center justify-center gap-2 bg-[#1A2A4A] text-white py-2.5 rounded-xl font-medium hover:bg-[#2a3d6e] transition-all"
              >
                <FaExternalLinkAlt />
                Open in Browser
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full text-center text-gray-500 text-sm py-2 hover:text-gray-700 transition"
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