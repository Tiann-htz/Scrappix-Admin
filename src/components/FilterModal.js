import { useState, useEffect } from 'react';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

export default function FilterModal({ isOpen, onClose, onApplyFilter, currentFilters }) {
  const [filters, setFilters] = useState({
    category: '',
    priceMin: '',
    priceMax: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    sellerName: ''
  });

  // Initialize filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters || {
        category: '',
        priceMin: '',
        priceMax: '',
        location: '',
        dateFrom: '',
        dateTo: '',
        sellerName: ''
      });
    }
  }, [isOpen, currentFilters]);

  const handleInputChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilter = () => {
    onApplyFilter(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category: '',
      priceMin: '',
      priceMax: '',
      location: '',
      dateFrom: '',
      dateTo: '',
      sellerName: ''
    };
    setFilters(clearedFilters);
    onApplyFilter(clearedFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FunnelIcon className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Filter Items</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Form */}
        <div className="p-6 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="Enter category"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
            />
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price (₱)
              </label>
              <input
                type="number"
                value={filters.priceMin}
                onChange={(e) => handleInputChange('priceMin', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price (₱)
              </label>
              <input
                type="number"
                value={filters.priceMax}
                onChange={(e) => handleInputChange('priceMax', e.target.value)}
                placeholder="999999"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
              />
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter location"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleInputChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
              />
            </div>
          </div>

          {/* Seller Name Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seller Name
            </label>
            <input
              type="text"
              value={filters.sellerName}
              onChange={(e) => handleInputChange('sellerName', e.target.value)}
              placeholder="Enter seller name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            Clear All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilter}
              className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors duration-200"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}