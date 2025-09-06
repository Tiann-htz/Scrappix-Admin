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

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center justify-between">
        {/* User Info - Clickable */}
        <div 
          className="flex items-center space-x-4 flex-1 cursor-pointer"
          onClick={() => onViewDetails(userData)}
        >
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

          {/* User Basic Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {userData.fullName || 'Unknown User'}
              </h3>
              {getRiskBadge(riskLevel)}
            </div>
            
            <p className="text-sm text-gray-600 mb-1">
              {userData.email}
            </p>
            
            {userData.nickname && (
              <p className="text-sm text-gray-500 mb-1">
                @{userData.nickname}
              </p>
            )}

            <div className="flex items-center space-x-2">
              {getStatusBadge(userData)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2 ml-4">
          {userData.isDisabled ? (
            <button
              className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg border cursor-not-allowed flex items-center space-x-1"
              disabled
            >
              <NoSymbolIcon className="h-4 w-4" />
              <span>Banned</span>
            </button>
          ) : userData.isActive === false ? (
            <button
              onClick={() => onReinstateUser(userData)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 flex items-center space-x-1 shadow-sm"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Reinstate</span>
            </button>
          ) : (
            <button
              onClick={() => onSuspendUser(userData)}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors duration-200 flex items-center space-x-1 shadow-sm"
            >
              <XCircleIcon className="h-4 w-4" />
              <span>Suspend</span>
            </button>
          )}
          
          {!userData.isDisabled && (
            <button
              onClick={() => onBanUser(userData)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center space-x-1 shadow-sm"
            >
              <NoSymbolIcon className="h-4 w-4" />
              <span>Ban User</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}