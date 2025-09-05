import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Image from 'next/image';
import { 
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function ChatViewModal({ chatId, reportedByUserId, reportedByUserName, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAvatars, setUserAvatars] = useState({});

  useEffect(() => {
  if (isOpen && chatId) {
    fetchChatMessages();
  }
}, [isOpen, chatId]);

useEffect(() => {
  if (messages.length > 0) {
    const userIds = [...new Set(messages.map(msg => msg.senderId))];
    fetchUserAvatars(userIds);
  }
}, [messages]);

  const fetchChatMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'asc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesData = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      setError('Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAvatars = async (userIds) => {
  try {
    const avatarPromises = userIds.map(async (userId) => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return {
        userId,
        avatar: userDoc.exists() ? userDoc.data().imageUrl : null
      };
    });
    
    const avatarResults = await Promise.all(avatarPromises);
    const avatarMap = {};
    avatarResults.forEach(({ userId, avatar }) => {
      avatarMap[userId] = avatar;
    });
    
    setUserAvatars(avatarMap);
  } catch (error) {
    console.error('Error fetching user avatars:', error);
  }
};

  const formatMessageTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Chat Messages</h3>
              <p className="text-sm text-gray-600">Viewing from {reportedByUserName}'s perspective</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-600">Loading messages...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No messages found in this chat</p>
            </div>
          ) : (
<div className="space-y-4">
  {messages.map((message) => {
    const isFromReportedBy = message.senderId === reportedByUserId;
    const userAvatar = userAvatars[message.senderId];
    
    return (
      <div key={message.id} className={`flex items-start space-x-3 ${isFromReportedBy ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {userAvatar ? (
            <div className="relative w-10 h-10">
              <Image
                src={userAvatar}
                alt={message.senderName}
                fill
                className="rounded-full object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-600" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={`max-w-xs lg:max-w-md ${isFromReportedBy ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Sender Name and Timestamp */}
          <div className={`flex items-center space-x-2 mb-1 ${isFromReportedBy ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <p className="text-xs font-medium text-gray-600">{message.senderName}</p>
            <p className="text-xs text-gray-400">{formatMessageTimestamp(message.timestamp)}</p>
          </div>

          {/* Message Bubble */}
          <div className={`px-4 py-2 rounded-2xl ${
            isFromReportedBy 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-900'
          } ${isFromReportedBy ? 'rounded-br-md' : 'rounded-bl-md'}`}>
            
            {/* Product Inquiry */}
            {message.productMessage && (
              <div className="mb-3">
                <p className={`text-xs font-semibold mb-2 ${isFromReportedBy ? 'text-green-100' : 'text-gray-600'}`}>
                  Product Inquiry:
                </p>
                <p className={`font-medium mb-2 ${isFromReportedBy ? 'text-white' : 'text-gray-900'}`}>
                  {message.productName}
                </p>
                {message.messageText && (
                  <p className={`text-sm mb-3 ${isFromReportedBy ? 'text-green-50' : 'text-gray-700'}`}>
                    {message.messageText.startsWith('Hi') || message.messageText.startsWith('Hello') 
                      ? message.messageText 
                      : `Hi, ${message.messageText}`}
                  </p>
                )}
                {message.productImageUrl && (
                  <div className="relative w-48 h-36 sm:w-56 sm:h-40 rounded-lg overflow-hidden border-2 border-opacity-30 border-white">
                    <Image 
                      src={message.productImageUrl} 
                      alt={message.productName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 192px, 224px"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Regular Text Message */}
            {message.messageText && !message.productMessage && (
              <p className="break-words">{message.messageText}</p>
            )}

            {/* Image Message */}
            {message.imageUrl && !message.productMessage && (
              <div className="relative w-48 h-36 sm:w-56 sm:h-40 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                <Image 
                  src={message.imageUrl} 
                  alt="Chat image"
                  fill
                  className="object-cover"
                  onClick={() => window.open(message.imageUrl, '_blank')}
                  sizes="(max-width: 640px) 192px, 224px"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  })}
</div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Total Messages: {messages.length}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}