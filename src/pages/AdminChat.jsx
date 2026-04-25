import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { db } from "../firebase/config";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs
} from "firebase/firestore";
import { FaReply, FaCheckDouble, FaSpinner, FaUser, FaHeadset, FaTimes } from "react-icons/fa";
import { BiSend } from "react-icons/bi";

const AdminChat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Check if user is admin (you can add your email here)
  const isAdmin = user?.email === "dallen02a@gmail.com"; // Change to your email

  useEffect(() => {
    if (!isAdmin) return;

    // Load chat sessions
    const sessionsQuery = query(
      collection(db, "chatSessions"),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const sessionList = [];
      snapshot.forEach(doc => {
        sessionList.push({ id: doc.id, ...doc.data() });
      });
      setSessions(sessionList);
    });

    return () => unsubscribeSessions();
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedSession) return;

    // Load messages for selected session
    const messagesRef = collection(db, "chatSessions", selectedSession.id, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgList = [];
      snapshot.forEach(doc => {
        msgList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgList);
      
      // Mark unread messages as read when viewing
      markMessagesAsRead(selectedSession.id);
    });

    return () => unsubscribeMessages();
  }, [selectedSession]);

  const markMessagesAsRead = async (sessionId) => {
    try {
      const messagesRef = collection(db, "chatSessions", sessionId, "messages");
      const q = query(messagesRef, where("isRead", "==", false), where("sender", "==", "user"));
      const snapshot = await getDocs(q);
      
      snapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, { isRead: true });
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSession) return;
    
    setSending(true);
    
    try {
      const messageData = {
        text: replyText,
        sender: "admin",
        senderName: "AjiraBora Support",
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      await addDoc(collection(db, "chatSessions", selectedSession.id, "messages"), messageData);
      
      // Update session last message
      await updateDoc(doc(db, "chatSessions", selectedSession.id), {
        lastMessageAt: new Date().toISOString(),
        lastMessage: replyText.substring(0, 100)
      });
      
      setReplyText("");
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <FaHeadset className="text-5xl text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <FaHeadset className="text-[#FF8C00]" />
          Admin Chat Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Active Chats ({sessions.length})</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No active chats</div>
              ) : (
                sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition ${
                      selectedSession?.id === session.id ? 'bg-orange-50 dark:bg-slate-700' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {session.userName || session.userEmail || "Guest User"}
                      </span>
                      <span className="text-xs text-gray-400">{formatTime(session.lastMessageAt)}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{session.lastMessage || "No messages yet"}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-400">{session.userEmail}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col h-[600px]">
            {selectedSession ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedSession.userName || selectedSession.userEmail || "Guest User"}
                      </h3>
                      <p className="text-xs text-gray-500">{selectedSession.userEmail}</p>
                    </div>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${msg.sender === "user" ? "order-2" : "order-1"}`}>
                        <div className={`rounded-2xl p-3 ${
                          msg.sender === "user" 
                            ? "bg-[#FF8C00] text-white rounded-br-sm" 
                            : "bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                        }`}>
                          <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                          {msg.sender === "user" ? "User" : "Admin"} • {formatTime(msg.createdAt)}
                          {msg.isRead && msg.sender === "user" && (
                            <FaCheckDouble className="inline ml-1 text-xs" />
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white text-sm"
                    />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="bg-gradient-to-r from-[#FF8C00] to-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:shadow-lg transition disabled:opacity-50"
                    >
                      {sending ? <FaSpinner className="animate-spin" /> : <BiSend />}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <FaHeadset className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Select a chat session to start replying</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;