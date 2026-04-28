import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { MdOutlineSmartToy } from 'react-icons/md';
import { FaExclamationTriangle, FaCopy, FaExternalLinkAlt } from 'react-icons/fa';

const AjiraBoraAI = ({ jobId, jobTitle }) => {
  const { user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Detect if user is in ChatGPT app
  const isChatGPTApp = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('chatgpt') || 
           userAgent.includes('openai') ||
           /chatgpt/i.test(userAgent);
  };

  // Force open in browser (bypass app)
  const forceOpenInBrowser = (url) => {
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // For iOS - use window.open with _system
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.open(url, '_blank');
      return;
    }
    
    // For Android - use intent URL
    if (/Android/i.test(navigator.userAgent)) {
      // Try to force Chrome
      const chromeIntent = `intent://${url.replace('https://', '')}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = chromeIntent;
      setTimeout(() => {
        window.open(url, '_blank');
      }, 500);
      return;
    }
    
    // Desktop - normal open
    link.click();
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      console.error('Clipboard failed:', err);
      return false;
    }
  };

  const openAI = async () => {
    if (!user) {
      alert('Please login to use AjiraBora AI');
      window.location.href = '/login';
      return;
    }

    if (!jobId) {
      alert('Job ID missing. Please refresh the page.');
      return;
    }

    // Save context for the AI
    localStorage.setItem('ajirabora_ai_context', JSON.stringify({
      userId: user.uid,
      jobId: jobId,
      jobTitle: jobTitle,
      userEmail: user.email,
      timestamp: Date.now()
    }));

    const fullPrompt = `🎯 JOB ANALYSIS REQUEST

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

    const aiUrl = 'https://chat.openai.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai';
    
    // Check if in ChatGPT app
    if (isChatGPTApp()) {
      // Copy prompt to clipboard
      await copyToClipboard(fullPrompt);
      setShowWarning(true);
      return;
    }
    
    // Not in ChatGPT app - open normally
    window.open(aiUrl, '_blank');
    
    // Also copy to clipboard as backup
    await copyToClipboard(fullPrompt);
  };

  const openInBrowserAndPaste = () => {
    const aiUrl = 'https://chat.openai.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai';
    
    // Copy prompt one more time to be safe
    const fullPrompt = `Job ID: ${jobId} | Job Title: ${jobTitle} | User ID: ${user.uid}`;
    copyToClipboard(fullPrompt);
    
    // Force open in browser
    forceOpenInBrowser(aiUrl);
    
    // Close warning modal
    setShowWarning(false);
    
    // Show instruction alert
    setTimeout(() => {
      alert('📋 Prompt copied to clipboard!\n\nPaste it in AjiraBora AI when ChatGPT opens.');
    }, 1000);
  };

  const copyPromptAndClose = async () => {
    const fullPrompt = `🎯 JOB ANALYSIS REQUEST

Please analyze this job for me:

Job ID: ${jobId}
Job Title: ${jobTitle}
User ID: ${user.uid}

Please call analyzeJobMatch API to analyze this job match.`;

    await copyToClipboard(fullPrompt);
    setShowWarning(false);
    
    alert('✓ Prompt copied to clipboard!\n\n1. Open Safari/Chrome browser\n2. Go to chat.openai.com\n3. Open your AjiraBora AI\n4. Paste the prompt (Ctrl+V or Cmd+V)');
  };

  return (
    <>
      <button
        onClick={openAI}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg"
      >
        <MdOutlineSmartToy className="text-xl" />
        Analyze with AjiraBora AI
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">AI</span>
      </button>

      {/* Warning Modal for ChatGPT App - Forces Browser */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all animate-slideUp">
            <div className="text-center mb-5">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FaExclamationTriangle className="text-yellow-600 text-4xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">⚠️ ChatGPT App Detected</h2>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                AjiraBora AI works best in a <strong className="text-orange-600">web browser</strong>. 
                The ChatGPT mobile app has limited API support.
              </p>
            </div>

            {/* Solution Box */}
            <div className="bg-blue-50 rounded-xl p-4 mb-5 border border-blue-200">
              <p className="text-blue-800 text-sm font-semibold mb-3 flex items-center gap-2">
                <FaExternalLinkAlt className="text-xs" />
                How to proceed:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-xs">1</div>
                  <span className="text-blue-700">Your analysis prompt is <strong>copied to clipboard</strong></span>
                  {copied && <span className="text-green-600 text-xs">✓ Copied!</span>}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-xs">2</div>
                  <span className="text-blue-700">Open <strong>Safari, Chrome, or Firefox</strong> browser</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-xs">3</div>
                  <span className="text-blue-700">Go to <strong>chat.openai.com</strong> and login</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-xs">4</div>
                  <span className="text-blue-700">Open <strong>AjiraBora AI</strong> and paste the prompt</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={openInBrowserAndPaste}
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white py-3.5 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
              >
                <FaExternalLinkAlt />
                Open in Browser (Recommended)
              </button>
              
              <button
                onClick={copyPromptAndClose}
                className="flex items-center justify-center gap-3 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                <FaCopy />
                {copied ? '✓ Copied!' : 'Copy Prompt Only'}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-5 pt-2 border-t border-gray-100">
              💡 Pro tip: Bookmark chat.openai.com for quick access
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default AjiraBoraAI;