import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  UserIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  AtSymbolIcon
} from '@heroicons/react/24/outline';

export default function UserDetailsModal({ user, isOpen, onClose }) {
  if (!user) return null;

  const getRiskLevel = (approvedReports) => {
    if (approvedReports >= 5) return 'high';
    if (approvedReports >= 3) return 'medium';
    if (approvedReports >= 1) return 'low';
    return 'none';
  };

  const getRiskBadge = (riskLevel) => {
    const riskStyles = {
      'high': 'bg-red-100 text-red-800 border border-red-200',
      'medium': 'bg-orange-100 text-orange-800 border border-orange-200',
      'low': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'none': 'bg-green-100 text-green-800 border border-green-200'
    };

    const riskLabels = {
      'high': 'High Risk',
      'medium': 'Medium Risk',
      'low': 'Low Risk',
      'none': 'Good Standing'
    };

    return (
      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${riskStyles[riskLevel]}`}>
        {riskLabels[riskLevel]}
      </span>
    );
  };

  const getStatusBadge = (user) => {
    if (user.isDisabled) {
      return <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 border border-red-200">Banned</span>;
    }
    if (user.isActive === false) {
      return <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800 border border-orange-200">Suspended</span>;
    }
    return <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 border border-green-200">Active</span>;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const riskLevel = getRiskLevel(user.approvedReports);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                    User Details
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                  {/* User Profile Section */}
                  <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                      {user.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt={user.fullName}
                          className="h-20 w-20 rounded-full object-cover border-4 border-gray-200"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                          <UserIcon className="h-10 w-10 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {user.fullName || 'Unknown User'}
                      </h2>
                      
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                        {getRiskBadge(riskLevel)}
                        {getStatusBadge(user)}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-center sm:justify-start">
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          <span>{user.email}</span>
                        </div>
                        
                        {user.nickname && (
                          <div className="flex items-center justify-center sm:justify-start">
                            <AtSymbolIcon className="h-4 w-4 mr-2" />
                            <span>{user.nickname}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-center sm:justify-start">
                          <CalendarDaysIcon className="h-4 w-4 mr-2" />
                          <span>Joined: {formatDate(user.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Behavior Statistics */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavior Statistics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Approved Reports */}
                      <div className="bg-red-50 rounded-lg p-4 text-center border border-red-100">
                        <div className="flex items-center justify-center mb-2">
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-red-700">Reports</span>
                        </div>
                        <p className="text-2xl font-bold text-red-800">{user.approvedReports}</p>
                        <p className="text-xs text-red-600 mt-1">Approved by Admin</p>
                        {user.approvedReports >= 5 && (
                          <p className="text-xs text-red-700 font-semibold mt-1">⚠️ High Risk User</p>
                        )}
                      </div>

                      {/* Chat Removals */}
                      <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-100">
                        <div className="flex items-center justify-center mb-2">
                          <XCircleIcon className="h-6 w-6 text-orange-500 mr-2" />
                          <span className="text-sm font-medium text-orange-700">Removals</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-800">{user.chatRemovals}</p>
                        <p className="text-xs text-orange-600 mt-1">Chat Exits</p>
                      </div>

                      {/* Posted Items */}
                      <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                        <div className="flex items-center justify-center mb-2">
                          <ShoppingBagIcon className="h-6 w-6 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-blue-700">Posted</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-800">{user.postedItems}</p>
                        <p className="text-xs text-blue-600 mt-1">Products Listed</p>
                      </div>

                      {/* Sold Items */}
                      <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                        <div className="flex items-center justify-center mb-2">
                          <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                          <span className="text-sm font-medium text-green-700">Sold</span>
                        </div>
                        <p className="text-2xl font-bold text-green-800">{user.soldItems}</p>
                        <p className="text-xs text-green-600 mt-1">Completed Sales</p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Risk Assessment</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {riskLevel === 'high' && (
                        <div className="text-red-700">
                          <p className="font-semibold mb-2">🚨 High Risk User</p>
                          <p className="text-sm">This user has received 5 or more approved reports. Immediate attention required.</p>
                        </div>
                      )}
                      {riskLevel === 'medium' && (
                        <div className="text-orange-700">
                          <p className="font-semibold mb-2">⚠️ Medium Risk User</p>
                          <p className="text-sm">This user has received 3-4 approved reports. Monitor closely.</p>
                        </div>
                      )}
                      {riskLevel === 'low' && (
                        <div className="text-yellow-700">
                          <p className="font-semibold mb-2">⚡ Low Risk User</p>
                          <p className="text-sm">This user has received 1-2 approved reports. Keep an eye on future activity.</p>
                        </div>
                      )}
                      {riskLevel === 'none' && (
                        <div className="text-green-700">
                          <p className="font-semibold mb-2">✅ Good Standing</p>
                          <p className="text-sm">This user has no approved reports against them.</p>
                        </div>
                      )}
                      
                      {user.chatRemovals > 10 && (
                        <div className="mt-3 p-3 bg-orange-100 rounded border border-orange-200">
                          <p className="text-sm text-orange-800">
                            <span className="font-semibold">Note:</span> High number of chat removals ({user.chatRemovals}) may indicate suspicious behavior patterns.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">User ID:</span>
                        <span className="font-mono text-gray-800">{user.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Created:</span>
                        <span className="text-gray-800">{formatDate(user.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="text-gray-800">{formatDate(user.updatedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="text-gray-800">
                          {user.postedItems > 0 ? `${((user.soldItems / user.postedItems) * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}