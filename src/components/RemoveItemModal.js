import { useState } from 'react';
import {
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function RemoveItemModal({ item, isOpen, onClose, onRemove }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedReasons = [
    'Item violates updated community guidelines',
    'Reported by multiple users as inappropriate',
    'Found to contain misleading information',
    'Quality does not meet marketplace standards',
    'Duplicate listing discovered',
    'Item category no longer permitted',
    'Safety concerns identified',
    'Pricing violations detected',
    'Other (please specify below)'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason && !customMessage.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    const removalMessage = selectedReason === 'Other (please specify below)' 
      ? customMessage.trim()
      : selectedReason + (customMessage.trim() ? ` - ${customMessage.trim()}` : '');

    try {
      await onRemove(item.id, removalMessage);
      handleClose();
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomMessage('');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <TrashIcon className="h-6 w-6 text-orange-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Remove Item</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              You are about to remove "<strong>{item.productName}</strong>" from the marketplace. 
              This item was previously approved. Please select a reason for removal:
            </p>
          </div>

          {/* Predefined Reasons */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Removal Reason
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {predefinedReasons.map((reason, index) => (
                <label key={index} className="flex items-start">
                  <input
                    type="radio"
                    name="removalReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={selectedReason === 'Other (please specify below)' 
                ? "Please specify the reason for removal..." 
                : "Add any additional notes for the seller..."}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(!selectedReason && !customMessage.trim()) || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Removing...' : 'Remove Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}