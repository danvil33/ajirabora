import React from 'react';
import { useAuth } from '../Context/AuthContext';

const AjiraBoraAI = ({ jobId, jobTitle }) => {
  const { user } = useAuth();

  const openAI = () => {
    if (!user) {
      alert('Please login to use AjiraBora AI');
      window.location.href = '/login';
      return;
    }

    // Save context
    localStorage.setItem('ajirabora_ai_context', JSON.stringify({
      userId: user.uid,
      jobId: jobId,
      jobTitle: jobTitle
    }));

    // Your GPT link
    const aiUrl = 'https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai';
    const message = `Please analyze job ${jobId} for me. My user ID is ${user.uid}`;
    
    window.open(`${aiUrl}?q=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <button
      onClick={openAI}
      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
    >
      🤖 Analyze with AjiraBora AI
    </button>
  );
};

export default AjiraBoraAI;