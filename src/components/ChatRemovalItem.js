import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { logAdminActivity, ACTIVITY_TYPES } from '../utils/AdminActivityLogger';

export default function ChatRemovalItem({ removal, formatTimestamp, getStatusBadge, onUpdate, onViewDetails }) {
  const { adminData } = useAuth();

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

  const handleCheckUser = () => {
    // TODO: Implement check user functionality
    console.log('Check user:', removal.removedByUserId);
  };

  const handleItemClick = (e) => {
    // Prevent modal opening when clicking action buttons
    if (e.target.closest('button')) return;
    onViewDetails(removal);
  };

  return (
    <div 
      onClick={handleItemClick}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-orange-300 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Removed Person - Main Highlight */}
<div className="mb-3">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-lg font-bold text-orange-600 mb-1">{removal.removedPersonName}</h3>
      <p className="text-sm text-gray-500">({removal.removedPersonRole})</p>
    </div>
    <div className="ml-2 mr-8">
      {getStatusBadge(removal.status || 'pending')}
    </div>
  </div>
</div>

          {/* Key Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div>
              <p className="font-medium text-gray-900">{removal.productName}</p>
            </div>
            <div>
              {getStatusBadge(removal.productStatus)}
            </div>
            <div className="text-gray-600">
              {formatTimestamp(removal.timestamp)}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 ml-4">
          <div className="flex space-x-2">
            <button
  onClick={handleAcknowledgeRemoval}
  disabled={removal.status === 'acknowledged'}
  className={`px-3 py-1.5 text-white text-xs font-medium rounded-md transition-colors duration-200 ${
    removal.status === 'acknowledged'
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-green-500 hover:bg-green-600'
  }`}
>
  {removal.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
</button>
            <button
              onClick={handleCheckUser}
              className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-md transition-colors duration-200"
            >
              Check User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}