import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';

const CompanyVerification = () => {
  const { user } = useAuth();
  const [domain, setDomain] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState(null);
  const [generatedToken, setGeneratedToken] = useState('');

  // Generate a unique token for the company
  const generateToken = () => {
    const token = `ajirabora-verify=${user?.uid}-${Date.now()}`;
    setGeneratedToken(token);
    setVerificationToken(token);
  };

  // Call the Vercel serverless function to verify
  const verifyDomain = async () => {
    if (!domain || !verificationToken) {
      alert('Please enter domain and generate token first');
      return;
    }

    setIsVerifying(true);
    setStatus(null);

    try {
      const response = await fetch('/api/verify-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domain,
          token: verificationToken,
          userId: user?.uid
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: data.message });
        // Update Firestore with verification status
        await updateVerificationStatus(true, domain);
      } else {
        setStatus({ 
          type: 'error', 
          message: data.error || data.message,
          token: data.token 
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to verify domain' });
    } finally {
      setIsVerifying(false);
    }
  };

  const updateVerificationStatus = async (isVerified, verifiedDomain) => {
    // Update Firestore
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../firebase/config');
    
    await updateDoc(doc(db, 'users', user.uid), {
      isDomainVerified: isVerified,
      verifiedDomain: verifiedDomain,
      verifiedAt: new Date().toISOString()
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Verify Your Company Domain</h3>
      
      {/* Domain Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Company Domain</label>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="w-full px-3 py-2 border rounded-lg"
        />
        <p className="text-xs text-gray-500 mt-1">Do not include https:// or www</p>
      </div>

      {/* Generate Token Button */}
      <button
        onClick={generateToken}
        disabled={!domain}
        className="mb-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
      >
        Generate Verification Token
      </button>

      {/* Display Token with Instructions */}
      {generatedToken && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium mb-2">Add this TXT record to your DNS:</p>
          <div className="bg-gray-100 dark:bg-slate-700 p-2 rounded font-mono text-xs">
            <strong>Type:</strong> TXT<br/>
            <strong>Name/Host:</strong> @ or yourdomain.com<br/>
            <strong>Value:</strong> {generatedToken}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            After adding the record, wait 1-5 minutes and click Verify
          </p>
        </div>
      )}

      {/* Verify Button */}
      <button
        onClick={verifyDomain}
        disabled={isVerifying || !verificationToken}
        className="w-full bg-[#FF8C00] text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
      >
        {isVerifying ? 'Verifying...' : 'Verify Domain'}
      </button>

      {/* Status Display */}
      {status && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          status.type === 'success' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {status.message}
        </div>
      )}
    </div>
  );
};

export default CompanyVerification;