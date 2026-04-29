import React, { useState, useEffect, useRef } from 'react';
import { FaCheckCircle, FaShieldAlt, FaSpinner } from 'react-icons/fa';
import logo from "../Assets/sofclouds.png";

const AdvancedCaptcha = ({ onVerify }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const startTimeRef = useRef(Date.now());
  const mouseMovementsRef = useRef(0);
  const keyPressesRef = useRef(0);
  const formFocusRef = useRef(false);
  
  useEffect(() => {
    const handleMouseMove = () => mouseMovementsRef.current++;
    const handleKeyPress = () => keyPressesRef.current++;
    const handleFocus = () => formFocusRef.current = true;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('focus', handleFocus, true);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('focus', handleFocus, true);
    };
  }, []);
  
  const handleCheck = async (e) => {
    const isChecked = e.target.checked;
    
    if (!isChecked) {
      setIsVerified(false);
      onVerify(false);
      return;
    }
    
    setIsVerifying(true);
    
    setTimeout(() => {
      const timeSpent = (Date.now() - startTimeRef.current) / 1000;
      
      let humanScore = 0;
      if (timeSpent > 4) humanScore += 40;
      if (mouseMovementsRef.current > 5) humanScore += 30;
      if (keyPressesRef.current > 0) humanScore += 20;
      if (formFocusRef.current) humanScore += 10;
      
      const isHuman = humanScore > 50;
      
      setIsVerified(isHuman);
      onVerify(isHuman);
      setIsVerifying(false);
    }, 500);
  };
  
  return (
    <div className={`border rounded-lg p-3 transition-all ${
      isVerified ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SofCloud" className="h-8 w-auto" />
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              onChange={handleCheck}
              disabled={isVerifying}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
            />
            <span className="text-sm text-gray-700">
              {isVerifying ? 'Verifying...' : 'I\'m not a robot'}
            </span>
          </label>
        </div>
        
        {isVerifying && <FaSpinner className="animate-spin text-gray-400" />}
        {isVerified && !isVerifying && <FaCheckCircle className="text-green-500" />}
        {!isVerified && !isVerifying && <FaShieldAlt className="text-gray-400" />}
      </div>
    </div>
  );
};

export default AdvancedCaptcha;