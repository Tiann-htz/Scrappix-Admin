import { useState } from 'react';
import Image from 'next/image';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PhotoIcon 
} from '@heroicons/react/24/outline';

export default function ProductImageCarousel({ images, productName, className = "" }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState({});
  
  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center border-4 border-gray-200 ${className}`}>
        <div className="text-center">
          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">No Image Available</p>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageError = (index) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Image */}
      <div className="relative overflow-hidden rounded-lg border-4 border-green-200 h-full">
        {imageError[currentImageIndex] ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Image Failed to Load</p>
            </div>
          </div>
        ) : (
          <Image
            src={images[currentImageIndex]} 
            alt={`${productName} - Image ${currentImageIndex + 1}`}
            fill
            className="object-cover"
            onError={() => handleImageError(currentImageIndex)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        
        {/* Navigation Arrows (only show if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-1 rounded-full transition-all duration-200"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-1 rounded-full transition-all duration-200"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation (only show if multiple images) */}
      {images.length > 1 && (
        <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all duration-200 relative ${
                index === currentImageIndex 
                  ? 'border-green-500 opacity-100' 
                  : 'border-gray-300 opacity-60 hover:opacity-80'
              }`}
            >
              {imageError[index] ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <PhotoIcon className="h-6 w-6 text-gray-400" />
                </div>
              ) : (
                <Image
                  src={image} 
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(index)}
                  sizes="64px"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}