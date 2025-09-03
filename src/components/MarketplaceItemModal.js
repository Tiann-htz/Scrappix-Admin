import { useState } from 'react';
import Image from 'next/image';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  TagIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function MarketplaceItemModal({ item, isOpen, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !item) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unavailable';
    
    try {
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unavailable';
    }
  };

  const nextImage = () => {
    if (item.imageUrls && item.imageUrls.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === item.imageUrls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (item.imageUrls && item.imageUrls.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? item.imageUrls.length - 1 : prev - 1
      );
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900 truncate">
            {item.productName || 'Product Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Carousel */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  <>
                    <Image
                      src={item.imageUrls[currentImageIndex]}
                      alt={`${item.productName} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    
                    {/* Navigation buttons */}
                    {item.imageUrls.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all duration-200"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all duration-200"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Image indicator */}
                    {item.imageUrls.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {item.imageUrls.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <TagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400">No images available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {item.imageUrls && item.imageUrls.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {item.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        currentImageIndex === index 
                          ? 'border-green-500' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Price */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-2" />
                  <span className="text-2xl font-bold text-green-700">
                    ₱{item.price || 'Price not set'}
                  </span>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <TagIcon className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                      <p className="text-sm font-medium text-gray-900">{item.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <MapPinIcon className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                      <p className="text-sm font-medium text-gray-900">{item.location || 'Location not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Posted Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(item.postedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <UserIcon className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Seller</p>
                    <p className="text-sm font-medium text-gray-900">{item.sellerName || 'Seller information unavailable'}</p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  item.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : item.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                </span>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Description</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              )}

              {/* Item ID */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">Item ID: {item.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}