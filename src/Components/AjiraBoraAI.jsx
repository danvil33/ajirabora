import React from 'react';
import { useAuth } from '../Context/AuthContext';
import { FaRobot, FaBrain, FaMagic, FaSparkles } from 'react-icons/fa';
import { MdOutlineSmartToy } from 'react-icons/md';

const AjiraBoraAI = ({ jobId, jobTitle }) => {
  const { user } = useAuth();

  const openAI = () => {
    if (!user) {
      alert('Please login to use AjiraBora AI');
      window.location.href = '/login';
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

    // Create the analysis prompt
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

Thank you! 🙏`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Your GPT link with pre-filled message
    const aiUrl = `https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai?q=${encodedMessage}`;
    
    // Open GPT in a new tab
    window.open(aiUrl, '_blank');
  };

  return (
    <button
      onClick={openAI}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg"
    >
      <MdOutlineSmartToy className="text-xl" />
      Analyze with AjiraBora AI
      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">AI</span>
    </button>
  );
};

export default AjiraBoraAI;