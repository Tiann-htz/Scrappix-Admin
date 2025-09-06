import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { logAdminActivity, ACTIVITY_TYPES } from '../utils/AdminActivityLogger';
import UserProfileModal from './UserProfileModal';

export default function ChatRemovalItem({ removal, formatTimestamp, getStatusBadge, onUpdate, onViewDetails }) {
  const { adminData } = useAuth();
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleAcknowledgeRemoval = async (e) => {
    e.stopPropagation(); // Prevent modal opening
    
    if (!adminData) {
      toast.error('Admin data not available');
      return;
    }

    try {
      const removalRef = doc(db, 'chatRemovals', removal.id);
      
      await updateDoc(removalRef, {
        status: 'acknowledged',
        acknowledgedAt: serverTimestamp(),
        acknowledgedBy: adminData.fullName
      });

      // Log admin activity
      await logAdminActivity({
        activityType: ACTIVITY_TYPES.CHAT_REMOVED_BY_ADMIN,
        description: `Acknowledged chat removal for product: ${removal.productName}`,
        details: {
          removalId: removal.id,
          removedUser: removal.removedPersonName,
          removedBy: removal.removedByUserName,
          productName: removal.productName,
          productStatus: removal.productStatus || 'unknown'
        }
      });

      toast.success(`Chat removal acknowledged for ${removal.productName}`);
      
      // Refresh the removals list
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error acknowledging removal:', error);
      toast.error('Failed to acknowledge removal. Please try again.');
    }
  };

  const handleCheckUser = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedUserId(removal.removedPersonId);
    setShowUserModal(true);
  };

  const handleItemClick = (e) => {
    // Prevent modal opening when clicking action buttons
    if (e.target.closest('button')) return;
    onViewDetails(removal);
  };

  return (
    <div 
      onClick={handleItemClick}
      className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-orange-300 transition-all duration-200 cursor-pointer"
    >
      {/* Mobile Layout (stacked) */}
      <div className="flex flex-col sm:hidden space-y-3">
        {/* Top row - Removed user and status */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-orange-600 truncate">
              {removal.removedPersonName}
            </h3>
            <p className="text-xs text-gray-500">({removal.removedPersonRole})</p>
          </div>
          <div className="ml-2">
            {getStatusBadge(removal.status || 'pending')}
          </div>
        </div>

        {/* Bottom row - Details and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1 text-xs text-gray-600 flex-1 min-w-0">
            <span className="truncate">
              <span className="font-medium">Product:</span> {removal.productName}
            </span>
            <span className="truncate">
              <span className="font-medium">Status:</span> {removal.productStatus}
            </span>
            <span className="truncate">
              <span className="font-medium">Date:</span> {formatTimestamp(removal.timestamp)}
            </span>
          </div>
          
          {/* Mobile Action buttons */}
          <div className="flex flex-col space-y-1 ml-2">
            <button
              onClick={handleAcknowledgeRemoval}
              disabled={removal.status === 'acknowledged'}
              className={`flex items-center justify-center px-2 py-1 text-white text-xs font-medium rounded transition-colors duration-200 min-w-16 ${
                removal.status === 'acknowledged'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {removal.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
            </button>
            <button
              onClick={handleCheckUser}
              className="flex items-center justify-center px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors duration-200 min-w-16"
            >
              Check User
            </button>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Layout (horizontal) */}
      <div className="hidden sm:flex items-center justify-between">
        {/* Left side - Removal details */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Removed Person - Main Highlight */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="text-sm font-bold text-orange-600">
                {removal.removedPersonName}
              </h3>
              <p className="text-xs text-gray-500">({removal.removedPersonRole})</p>
              <div className="ml-2">
                {getStatusBadge(removal.status || 'pending')}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span className="truncate">
                <span className="font-medium">Product:</span> {removal.productName}
              </span>
              <span className="truncate">
                <span className="font-medium">Product Status:</span> {getStatusBadge(removal.productStatus)}
              </span>
              <span className="flex-shrink-0">
                <span className="font-medium">Date:</span> {formatTimestamp(removal.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleAcknowledgeRemoval}
            disabled={removal.status === 'acknowledged'}
            className={`flex items-center px-3 py-2 text-white text-xs font-medium rounded-lg transition-colors duration-200 ${
              removal.status === 'acknowledged'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {removal.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
          </button>
          <button
            onClick={handleCheckUser}
            className="flex items-center px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors duration-200"
          >
            Check User
          </button>
        </div>
      </div>

      {/* User Profile Modal */}
      {showUserModal && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showUserModal}
          onClose={(e) => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            setShowUserModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
}