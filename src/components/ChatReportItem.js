import { 
  ExclamationTriangleIcon,
  UserIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

export default function ChatReportItem({ report, formatTimestamp, getStatusBadge, onUpdate, onViewDetails }) {
  
  const handleApproveReport = () => {
    // TODO: Implement approve functionality
    console.log('Approve report:', report.id);
  };

  const handleRejectReport = () => {
    // TODO: Implement reject functionality
    console.log('Reject report:', report.id);
  };

  const handleItemClick = (e) => {
    // Prevent modal opening when clicking action buttons
    if (e.target.closest('button')) return;
    onViewDetails(report);
  };

  return (
    <div 
      onClick={handleItemClick}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-red-300 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Reported User - Main Highlight */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-red-600 mb-1">{report.reportedPersonName}</h3>
            <p className="text-sm text-gray-500">({report.reportedPersonRole})</p>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div>
              <p className="font-medium text-gray-900">{report.productName}</p>
            </div>
            <div>
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                {report.reportCategory}
              </span>
            </div>
            <div className="text-gray-600">
              {formatTimestamp(report.timestamp)}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 ml-4">
          <div className="flex space-x-2">
            <button
              onClick={handleApproveReport}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors duration-200"
            >
              Approve
            </button>
            <button
              onClick={handleRejectReport}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors duration-200"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}