import { 
  UserIcon, 
  NoSymbolIcon, 
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function UserItem({ userData, onViewDetails, onSuspendUser, onReinstateUser, onBanUser }) {
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
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${riskStyles[riskLevel]}`}>
        {riskLabels[riskLevel]}
      </span>
    );
  };

  const getStatusBadge = (user) => {
    if (user.isDisabled) {
      return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">Banned</span>;
    }
    if (user.isActive === false) {
      return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 border border-orange-200">Suspended</span>;
    }
    return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">Active</span>;
  };

  const riskLevel = getRiskLevel(userData.approvedReports);

  const handleItemClick = (e) => {
    // Prevent modal opening when clicking action buttons
    if (e.target.closest('button')) return;
    onViewDetails(userData);
  };

  return (
    <div 
      onClick={handleItemClick}
      className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
    >
      {/* Mobile Layout (stacked) */}
      <div className="flex flex-col sm:hidden space-y-3">
        {/* Top row - User info and avatar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {userData.imageUrl ? (
                <img 
                  src={userData.imageUrl} 
                  alt={userData.fullName}
                  className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate">
                {userData.fullName || 'Unknown User'}
              </h3>
              <p className="text-xs text-gray-500 truncate">{userData.email}</p>
              {/* Risk badge moved here - below email */}
              <div className="mt-1">
                {getRiskBadge(riskLevel)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row - Details and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1 text-xs text-gray-600 flex-1 min-w-0">
            {userData.nickname && (
              <span className="truncate">
              </span>
            )}
            
          </div>
          
          {/* Mobile Action buttons */}
          <div className="flex flex-col space-y-1 ml-2">
            {userData.isDisabled ? (
              <button
                className="flex items-center justify-center px-2 py-1 text-gray-500 bg-gray-100 text-xs font-medium rounded cursor-not-allowed min-w-16"
                disabled
              >
                <NoSymbolIcon className="h-3 w-3 mr-1" />
                Banned
              </button>
            ) : userData.isActive === false ? (
              <button
                onClick={() => onReinstateUser(userData)}
                className="flex items-center justify-center px-2 py-1 text-white bg-green-600 hover:bg-green-700 text-xs font-medium rounded transition-colors duration-200 min-w-16"
              >
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Reinstate
              </button>
            ) : (
              <button
                onClick={() => onSuspendUser(userData)}
                className="flex items-center justify-center px-2 py-1 text-white bg-orange-500 hover:bg-orange-600 text-xs font-medium rounded transition-colors duration-200 min-w-16"
              >
                <XCircleIcon className="h-3 w-3 mr-1" />
                Suspend
              </button>
            )}
            
            {!userData.isDisabled && (
              <button
                onClick={() => onBanUser(userData)}
                className="flex items-center justify-center px-2 py-1 text-white bg-red-600 hover:bg-red-700 text-xs font-medium rounded transition-colors duration-200 min-w-16"
              >
                <NoSymbolIcon className="h-3 w-3 mr-1" />
                Ban
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Layout (horizontal) */}
      <div className="hidden sm:flex items-center justify-between">
        {/* Left side - User details */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {userData.imageUrl ? (
              <img 
                src={userData.imageUrl} 
                alt={userData.fullName}
                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                <UserIcon className="h-6 w-6 text-gray-500" />
              </div>
            )}
          </div>

          {/* User Main Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="text-lg font-bold text-gray-900">
                {userData.fullName || 'Unknown User'}
              </h3>
              {getRiskBadge(riskLevel)}
            
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="truncate">
                <span className="font-medium">Email:</span> {userData.email}
              </span>
              {userData.nickname && (
                <span className="truncate">
                </span>
              )}
             
            </div>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-2 ml-4">
          {userData.isDisabled ? (
            <button
              className="flex items-center px-4 py-2 text-gray-500 bg-gray-100 text-sm font-medium rounded-lg cursor-not-allowed"
              disabled
            >
              <NoSymbolIcon className="h-4 w-4 mr-2" />
              Banned
            </button>
          ) : userData.isActive === false ? (
            <button
              onClick={() => onReinstateUser(userData)}
              className="flex items-center px-4 py-2 text-white bg-green-600 hover:bg-green-700 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Reinstate
            </button>
          ) : (
            <button
              onClick={() => onSuspendUser(userData)}
              className="flex items-center px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              Suspend
            </button>
          )}
          
          {!userData.isDisabled && (
            <button
              onClick={() => onBanUser(userData)}
              className="flex items-center px-4 py-2 text-white bg-red-600 hover:bg-red-700 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              <NoSymbolIcon className="h-4 w-4 mr-2" />
              Ban User
            </button>
          )}
        </div>
      </div>
    </div>
  );
}