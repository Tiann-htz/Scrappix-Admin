import { 
  XMarkIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CalendarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import ProductImageCarousel from './ProductImageCarousel';
import ChatViewModal from './ChatViewModal';
import { useState } from 'react';

export default function ReportsModal({ item, type, isOpen, onClose, formatTimestamp, getStatusBadge }) {
  if (!isOpen || !item) return null;

  const isReport = type === 'report';
  const [showChatModal, setShowChatModal] = useState(false);
  

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
       {/* Modal Header */}
<div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
  <div className="flex items-center space-x-3">
    {isReport ? (
      <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
    ) : (
      <TrashIcon className="h-8 w-8 text-orange-500" />
    )}
    <div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
        {isReport ? 'Chat Report Details' : 'Chat Removal Details'}
      </h3>
    </div>
  </div>
  
  <div className="flex items-center space-x-4">
   {/* Status Badge in Header */}
{isReport && (
  <div className="flex flex-col items-end space-y-1">
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-600">Status:</span>
      {getStatusBadge(item.status)}
    </div>
    {item.status === 'approved' && item.approvedBy && (
      <div className="text-xs text-gray-500">
        Approved by: {item.approvedBy}
        {item.approvedAt && (
          <div>on {formatTimestamp(item.approvedAt)}</div>
        )}
      </div>
    )}
    {item.status === 'rejected' && item.rejectedBy && (
      <div className="text-xs text-gray-500">
        Rejected by: {item.rejectedBy}
        {item.rejectedAt && (
          <div>on {formatTimestamp(item.rejectedAt)}</div>
        )}
      </div>
    )}
  </div>
)}
{!isReport && item.status === 'acknowledged' && item.acknowledgedBy && (
  <div className="text-xs text-gray-500">
    Acknowledged by: {item.acknowledgedBy}
    {item.acknowledgedAt && (
      <div>on {formatTimestamp(item.acknowledgedAt)}</div>
    )}
  </div>
)}
    
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
    >
      <XMarkIcon className="h-6 w-6" />
    </button>
  </div>
</div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6">
          <div className="space-y-8">
            {/* Main User Information with Images */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Primary User (Reported/Removed Person) */}
<div className="bg-gray-50 rounded-lg p-6">
  <div className="flex flex-col items-center space-y-4">
    <div className="flex-shrink-0">
      {(isReport ? item.reportedPersonImage : item.removedPersonImage) ? (
        <img 
          src={isReport ? item.reportedPersonImage : item.removedPersonImage} 
          alt={isReport ? item.reportedPersonName : item.removedPersonName}
          className={`h-24 w-24 rounded-full object-cover border-4 ${
            isReport ? 'border-red-200' : 'border-orange-200'
          }`}
        />
      ) : (
        <div className={`h-24 w-24 rounded-full flex items-center justify-center border-4 ${
          isReport ? 'bg-red-100 border-red-200' : 'bg-orange-100 border-orange-200'
        }`}>
          <div className="text-center">
            <PhotoIcon className={`h-10 w-10 mx-auto ${isReport ? 'text-red-400' : 'text-orange-400'}`} />
            <p className="text-xs text-gray-500 mt-1">No Image</p>
          </div>
        </div>
      )}
    </div>
    
    <div className="text-center space-y-2">
      <p className={`text-sm font-medium uppercase tracking-wide ${
        isReport ? 'text-red-500' : 'text-orange-500'
      }`}>
        {isReport ? 'Reported User' : 'Removed Person'}
      </p>
      <p className="text-2xl font-bold text-gray-900">
        {isReport ? item.reportedPersonName : item.removedPersonName}
      </p>
      <p className="text-sm text-gray-500">
        Role: {isReport ? item.reportedPersonRole : item.removedPersonRole}
      </p>
      
      {/* Report Reason - Only for reports */}
      {isReport && (
        <div className="mt-4">
          <div className="inline-flex items-center space-x-2 px-3 py-2 bg-red-100 rounded-lg">
            <span className="text-sm font-medium text-red-700">Reason:</span>
            <span className="text-sm font-semibold text-red-800">{item.reportCategory}</span>
          </div>
        </div>
      )}
    </div>
  </div>
</div>

             {/* Secondary User */}
<div className="bg-blue-50 rounded-lg p-6">
  <div className="flex flex-col items-center space-y-4">
    <div className="flex-shrink-0">
      {(isReport ? item.reportedByUserImage : item.removedByUserImage) ? (
        <img 
          src={isReport ? item.reportedByUserImage : item.removedByUserImage} 
          alt={isReport ? item.reportedByUserName : item.removedByUserName}
          className="h-24 w-24 rounded-full object-cover border-4 border-blue-200"
        />
      ) : (
        <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
          <div className="text-center">
            <PhotoIcon className="h-10 w-10 text-blue-400 mx-auto" />
            <p className="text-xs text-gray-500 mt-1">No Image</p>
          </div>
        </div>
      )}
    </div>
    
    <div className="text-center space-y-2">
      <p className="text-sm font-medium text-blue-500 uppercase tracking-wide">
        {isReport ? 'Reporter' : 'Removed By'}
      </p>
      <p className="text-2xl font-bold text-gray-900">
        {isReport ? item.reportedByUserName : item.removedByUserName}
      </p>
    </div>
  </div>
</div>
            </div>

           {/* Product Information with Large Image Carousel */}
<div className="bg-green-50 rounded-lg p-6">
  <p className="text-lg font-medium text-green-500 uppercase tracking-wide text-center mb-6">Product Details</p>
  
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Product Images */}
    <div>
      <ProductImageCarousel 
        images={item.productImages}
        productName={item.productName}
        className="h-64 sm:h-80"
      />
    </div>
    
    {/* Product Info */}
    <div className="flex flex-col justify-center space-y-4">
      <div className="text-center lg:text-left">
        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{item.productName}</p>
      </div>
      
      {/* Product Status */}
      <div className="flex items-center justify-center lg:justify-start space-x-3">
        <span className="text-sm font-medium text-gray-700">Product Status:</span>
        {getStatusBadge(isReport ? 'available' : item.productStatus)}
      </div>
      
      <div className="flex items-center justify-center lg:justify-start space-x-3">
        <CalendarIcon className="h-5 w-5 text-gray-500" />
        <div>
          <p className="text-sm font-medium text-gray-700">
            {isReport ? 'Reported At' : 'Removed At'}
          </p>
          <p className="text-lg font-semibold text-gray-900">{formatTimestamp(item.timestamp)}</p>
        </div>
      </div>
    </div>
  </div>
</div>

            {/* Chat Information */}
<div className="bg-purple-50 rounded-lg p-6">
  <div className="flex items-center justify-between">
    <div className="flex items-start space-x-4">
      <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-500 mt-0.5" />
      <div className="flex-1">
        <p className="text-lg font-medium text-purple-500 uppercase tracking-wide mb-3">Chat Messages</p>
        <p className="text-sm text-gray-600 mb-2">
          View the complete chat conversation from the reporter's perspective
        </p>
        <p className="text-xs text-gray-500 font-mono bg-white p-2 rounded border border-purple-200 break-all">
          Chat ID: {item.chatId}
        </p>
      </div>
    </div>
    <button
      onClick={() => setShowChatModal(true)}
      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-2"
    >
      <ChatBubbleLeftRightIcon className="h-4 w-4" />
      <span>View Chat</span>
    </button>
  </div>
</div>
          </div>
        </div>
      </div>
      {/* Chat View Modal */}
<ChatViewModal 
  chatId={item.chatId}
  reportedByUserId={isReport ? item.reportedByUserId : item.removedByUserId}
  reportedByUserName={isReport ? item.reportedByUserName : item.removedByUserName}
  isOpen={showChatModal}
  onClose={() => setShowChatModal(false)}
/>
    </div>
  );
}