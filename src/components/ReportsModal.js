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

export default function ReportsModal({ item, type, isOpen, onClose, formatTimestamp, getStatusBadge }) {
  if (!isOpen || !item) return null;

  const isReport = type === 'report';
  

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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
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
                    {!isReport && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Product Status</p>
                        {getStatusBadge(item.productStatus)}
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
                    {isReport && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Report Reason</p>
                          <span className="inline-flex px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                            {item.reportCategory}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Current Status</p>
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    )}
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
              <div className="flex items-start space-x-4">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-lg font-medium text-purple-500 uppercase tracking-wide mb-3">Chat Reference</p>
                  <p className="text-sm text-gray-500 font-mono bg-white p-4 rounded-lg border border-purple-200 break-all">
                    {item.chatId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}