// src/components/AjiraBoraAI.jsx
import React, { useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { MdOutlineSmartToy } from "react-icons/md";

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

    const message = `Analyze jobId: ${jobId} for userId: ${user.uid}`;

    try {
      await navigator.clipboard.writeText(message);
      setShowModal(true);

      setTimeout(() => {
        window.open(
          "https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai",
          "_blank"
        );
      }, 1200);
    } catch (err) {
      console.error("Clipboard failed:", err);
      window.open(
        "https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai",
        "_blank"
      );
    }

    setLoading(false);
  };

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={openAI}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg disabled:opacity-60"
      >
        <MdOutlineSmartToy className="text-xl" />
        {loading ? "Preparing AI..." : "Analyze with Danvil AI"}
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
          AI
        </span>
      </button>

      {/* MODAL (AUTO-FILL FEEL) */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm text-center shadow-xl animate-fadeIn">
            <div className="text-4xl mb-3">🤖</div>
            <h2 className="text-lg font-bold text-gray-800">
              Danvil AI Ready
            </h2>

            <p className="text-sm text-gray-600 mt-2">
              Your job analysis request has been prepared automatically.
            </p>

            <div className="mt-4 text-sm text-green-600 font-semibold">
              ✅ Request copied
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Danvil AI is opening... just paste and send.
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AjiraBoraAI;