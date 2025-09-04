import { 
  TrashIcon,
  UserIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

export default function ChatRemovalItem({ removal, formatTimestamp, getStatusBadge, onUpdate, onViewDetails }) {
  
  const handleRemoveChat = () => {
    // TODO: Implement remove chat functionality
    console.log('Remove chat:', removal.id);
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
            <h3 className="text-lg font-bold text-orange-600 mb-1">{removal.removedPersonName}</h3>
            <p className="text-sm text-gray-500">({removal.removedPersonRole})</p>
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
              onClick={handleRemoveChat}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors duration-200"
            >
              Remove
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