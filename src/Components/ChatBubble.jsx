import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../Context/AuthContext";
import { db } from "../firebase/config";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  limit,
  getDocs,
  getDoc
} from "firebase/firestore";
import { FaTimes, FaPaperPlane, FaSpinner, FaHeadset } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { MdMarkEmailRead } from "react-icons/md";

const ChatBubble = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [welcomeSent, setWelcomeSent] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Get unique identifier for current user (email or guest ID)
  const getUserIdentifier = () => {
    if (user?.uid) return user.uid; // Registered user
    let guestId = localStorage.getItem("guestId");
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem("guestId", guestId);
    }
    return guestId;
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (error) {
      console.log("🔔 New message notification");
    }
  };

  // Get or create chat session (unique per user)
  const initializeChatSession = async () => {
    const userIdentifier = getUserIdentifier();
    
    // Check if we already have a session ID in memory
    if (sessionId) return sessionId;
    
    // Check localStorage for existing session for this user
    const storedSessionKey = `chatSessionId_${userIdentifier}`;
    const storedSessionId = localStorage.getItem(storedSessionKey);
    
    if (storedSessionId) {
      // Verify session still exists in Firestore
      const sessionRef = doc(db, "chatSessions", storedSessionId);
      const sessionSnap = await getDoc(sessionRef);
      if (sessionSnap.exists()) {
        setSessionId(storedSessionId);
        return storedSessionId;
      }
    }
    
    try {
      // Create new session for this specific user
      const newSession = await addDoc(collection(db, "chatSessions"), {
        userId: user?.uid || userIdentifier,
        userEmail: user?.email || "guest@ajirabora.com",
        userName: user?.displayName || `Guest ${userIdentifier.substring(0, 8)}`,
        userIdentifier: userIdentifier, // Store unique identifier
        status: "active",
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        isResolved: false,
        welcomeSent: false
      });
      
      // Store session ID in localStorage with user-specific key
      localStorage.setItem(storedSessionKey, newSession.id);
      setSessionId(newSession.id);
      return newSession.id;
    } catch (error) {
      console.error("Error creating chat session:", error);
      return null;
    }
  };

  // Send welcome message (only once per user)
  const sendWelcomeMessage = async (sessionId) => {
    if (welcomeSent) return false;
    
    try {
      const sessionRef = doc(db, "chatSessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      const sessionData = sessionSnap.data();
      
      if (sessionData?.welcomeSent === true) {
        setWelcomeSent(true);
        return false;
      }
      
      // Check if there are already any messages in the session
      const messagesRef = collection(db, "chatSessions", sessionId, "messages");
      const messagesQuery = query(messagesRef, limit(1));
      const existingMessages = await getDocs(messagesQuery);
      
      if (!existingMessages.empty) {
        await updateDoc(sessionRef, { welcomeSent: true });
        setWelcomeSent(true);
        return false;
      }
      
      const welcomeMessage = {
        text: "👋 Welcome to AjiraBora! 🎉\n\nI'm here to help you with:\n• Finding job opportunities\n• Posting jobs\n• Account assistance\n• Any questions you have\n\nHow can I help you today?",
        sender: "admin",
        senderName: "AjiraBora Support",
        createdAt: new Date().toISOString(),
        isRead: false,
        isWelcome: true
      };
      
      await addDoc(collection(db, "chatSessions", sessionId, "messages"), welcomeMessage);
      await updateDoc(sessionRef, { welcomeSent: true });
      setWelcomeSent(true);
      playNotificationSound();
      setUnreadCount(1);
      
      return true;
    } catch (error) {
      console.error("Error sending welcome message:", error);
      return false;
    }
  };

  // Load messages
  useEffect(() => {
    let unsubscribe = null;
    
    const setupChat = async () => {
      const sid = await initializeChatSession();
      if (!sid) return;
      
      await sendWelcomeMessage(sid);
      
      const messagesRef = collection(db, "chatSessions", sid, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = [];
        let unread = 0;
        
        snapshot.forEach(doc => {
          const msg = { id: doc.id, ...doc.data() };
          msgs.push(msg);
          
          if (!msg.isRead && msg.sender === "admin") {
            unread++;
          }
        });
        
        setMessages(msgs);
        
        if (unread > unreadCount) {
          setUnreadCount(unread);
          if (!isOpen) {
            playNotificationSound();
          }
        } else {
          setUnreadCount(unread);
        }
        
        if (isOpen && unread > 0) {
          markMessagesAsRead(sid);
          setUnreadCount(0);
        }
        
        scrollToBottom();
      });
    };
    
    setupChat();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isOpen, user]);

  const markMessagesAsRead = async (sid) => {
    try {
      const messagesRef = collection(db, "chatSessions", sid, "messages");
      const q = query(messagesRef, where("isRead", "==", false), where("sender", "==", "admin"));
      
      const snapshot = await getDocs(q);
      const batch = [];
      snapshot.forEach((doc) => {
        batch.push(updateDoc(doc.ref, { isRead: true }));
      });
      await Promise.all(batch);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    
    try {
      const sid = sessionId || await initializeChatSession();
      if (!sid) {
        alert("Failed to start chat session. Please try again.");
        setLoading(false);
        return;
      }
      
      const messageData = {
        text: message,
        sender: "user",
        senderId: user?.uid || getUserIdentifier(),
        senderName: user?.displayName || "Guest User",
        senderEmail: user?.email || "guest@ajirabora.com",
        type: user ? "registered" : "guest",
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      await addDoc(collection(db, "chatSessions", sid, "messages"), messageData);
      
      await updateDoc(doc(db, "chatSessions", sid), {
        lastMessageAt: new Date().toISOString(),
        lastMessage: message.substring(0, 100),
        userId: user?.uid || getUserIdentifier(),
        userEmail: user?.email || "guest@ajirabora.com"
      });
      
      setMessage("");
      
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#FF8C00] to-orange-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
        style={{ boxShadow: "0 4px 15px rgba(255, 140, 0, 0.4)" }}
      >
        {isOpen ? (
          <FaTimes className="text-xl" />
        ) : (
          <div className="relative">
            <FaHeadset className="text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden" style={{ animation: "slide-up 0.3s ease-out" }}>
          <div className="bg-gradient-to-r from-[#1A2A4A] to-[#2a3d6e] dark:from-[#0f1a2e] dark:to-[#1a2a4a] p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF8C00] to-orange-500 rounded-full flex items-center justify-center">
                <FaHeadset className="text-xl" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  AjiraBora Support
                  <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full">Online</span>
                </h3>
                <p className="text-xs opacity-90">Reply within minutes</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition"
            >
              <FaTimes />
            </button>
          </div>

          <div 
            ref={chatContainerRef}
            className="h-96 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800"
          >
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <FaHeadset className="text-5xl text-[#FF8C00] mx-auto mb-3 animate-bounce" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  👋 Welcome! Need help?<br />
                  Ask us anything – we're here for you!
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const showDate = idx === 0 || formatDate(msg.createdAt) !== formatDate(messages[idx-1]?.createdAt);
                  const isWelcome = msg.isWelcome;
                  
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="text-center my-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] ${msg.sender === "user" ? "order-2" : "order-1"}`}>
                          <div className={`rounded-2xl p-3 ${
                            msg.sender === "user" 
                              ? "bg-gradient-to-r from-[#FF8C00] to-orange-500 text-white rounded-br-sm" 
                              : isWelcome
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white rounded-bl-sm"
                                : "bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                          }`}>
                            <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                            {msg.sender === "user" ? "You" : "AjiraBora Team"} • {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="px-4 py-1">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Support team is online
            </span>
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="bg-gradient-to-r from-[#FF8C00] to-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane className="text-sm" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
              <MdMarkEmailRead className="text-xs" />
              We'll reply within minutes
            </p>
          </form>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default ChatBubble;