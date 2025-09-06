import { doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { logAdminActivity, ACTIVITY_TYPES } from '../utils/AdminActivityLogger';

export default function ChatReportItem({ report, formatTimestamp, getStatusBadge, onUpdate, onViewDetails }) {
  const { adminData } = useAuth();

  const handleApproveReport = async (e) => {
    e.stopPropagation(); // Prevent modal opening
    
    if (!adminData) {
      toast.error('Admin data not available');
      return;
    }

    try {
      const reportRef = doc(db, 'chatReports', report.id);
      
      await updateDoc(reportRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: adminData.fullName
      });

      // Log admin activity
      await logAdminActivity({
        activityType: ACTIVITY_TYPES.CHAT_REPORT_RESOLVED,
        description: `Approved reported user: ${report.reportedPersonName}`,
        details: {
          reportId: report.id,
          reportedUser: report.reportedPersonName,
          reportedBy: report.reportedByUserName,
          productName: report.productName,
          reportCategory: report.reportCategory,
          page: 'Reports Moderation'
        }
      });

      toast.success(`Report for ${report.reportedPersonName} approved successfully`);
      
      // Refresh the reports list
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error('Failed to approve report. Please try again.');
    }
  };

  const handleRejectReport = async (e) => {
    e.stopPropagation(); // Prevent modal opening
    
    if (!adminData) {
      toast.error('Admin data not available');
      return;
    }

    try {
      const reportRef = doc(db, 'chatReports', report.id);
      
      if (report.status === 'rejected') {
        // Undo rejection - set back to pending
        await updateDoc(reportRef, {
          status: 'pending',
          rejectedAt: deleteField(),
          rejectedBy: deleteField()
        });

        // Log admin activity for undoing rejection
        await logAdminActivity({
          activityType: ACTIVITY_TYPES.CHAT_REPORT_REVIEWED,
          description: `Undid rejection for reported user: ${report.reportedPersonName}`,
          details: {
            reportId: report.id,
            reportedUser: report.reportedPersonName,
            reportedBy: report.reportedByUserName,
            productName: report.productName,
            reportCategory: report.reportCategory,
            page: 'Reports Moderation',
            action: 'undo_rejection'
          }
        });

        toast.success(`Rejection undone for ${report.reportedPersonName}. Status set back to pending.`);
      } else {
        // Reject the report
        await updateDoc(reportRef, {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
          rejectedBy: adminData.fullName
        });

        // Log admin activity for rejection
        await logAdminActivity({
          activityType: ACTIVITY_TYPES.CHAT_REPORT_DISMISSED,
          description: `Rejected reported user: ${report.reportedPersonName}`,
          details: {
            reportId: report.id,
            reportedUser: report.reportedPersonName,
            reportedBy: report.reportedByUserName,
            productName: report.productName,
            reportCategory: report.reportCategory,
            page: 'Reports Moderation'
          }
        });

        toast.success(`Report for ${report.reportedPersonName} rejected successfully`);
      }
      
      // Refresh the reports list
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error processing report rejection:', error);
      toast.error('Failed to process rejection. Please try again.');
    }
  };

  const handleItemClick = (e) => {
    // Prevent modal opening when clicking action buttons
    if (e.target.closest('button')) return;
    onViewDetails(report);
  };

  return (
    <div 
      onClick={handleItemClick}
      className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-red-300 transition-all duration-200 cursor-pointer"
    >
      {/* Mobile Layout (stacked) */}
      <div className="flex flex-col sm:hidden space-y-3">
        {/* Top row - Reported user and status */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-red-600 truncate">
              {report.reportedPersonName}
            </h3>
            <p className="text-xs text-gray-500">({report.reportedPersonRole})</p>
          </div>
          <div className="ml-2">
            {getStatusBadge(report.status)}
          </div>
        </div>

        {/* Bottom row - Details and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1 text-xs text-gray-600 flex-1 min-w-0">
            <span className="truncate">
              <span className="font-medium">Product:</span> {report.productName}
            </span>
            <span className="truncate">
              <span className="font-medium">Category:</span> {report.reportCategory}
            </span>
            <span className="truncate">
              <span className="font-medium">Date:</span> {formatTimestamp(report.timestamp)}
            </span>
          </div>
          
          {/* Mobile Action buttons */}
          <div className="flex flex-col space-y-1 ml-2">
            <button
              onClick={handleApproveReport}
              disabled={report.status === 'approved'}
              className={`flex items-center justify-center px-2 py-1 text-white text-xs font-medium rounded transition-colors duration-200 min-w-16 ${
                report.status === 'approved'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {report.status === 'approved' ? 'Approved' : 'Approve'}
            </button>
            <button
              onClick={handleRejectReport}
              className={`flex items-center justify-center px-2 py-1 text-white text-xs font-medium rounded transition-colors duration-200 min-w-16 ${
                report.status === 'rejected'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {report.status === 'rejected' ? 'Undo' : 'Reject'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Layout (horizontal) */}
      <div className="hidden sm:flex items-center justify-between">
        {/* Left side - Report details */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Reported User - Main Highlight */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="text-sm font-bold text-red-600">
                {report.reportedPersonName}
              </h3>
              <p className="text-xs text-gray-500">({report.reportedPersonRole})</p>
              <div className="ml-2">
                {getStatusBadge(report.status)}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span className="truncate">
                <span className="font-medium">Product:</span> {report.productName}
              </span>
              <span className="truncate">
                <span className="font-medium">Category:</span> {report.reportCategory}
              </span>
              <span className="flex-shrink-0">
                <span className="font-medium">Date:</span> {formatTimestamp(report.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleApproveReport}
            disabled={report.status === 'approved'}
            className={`flex items-center px-3 py-2 text-white text-xs font-medium rounded-lg transition-colors duration-200 ${
              report.status === 'approved'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {report.status === 'approved' ? 'Approved' : 'Approve'}
          </button>
          <button
            onClick={handleRejectReport}
            className={`flex items-center px-3 py-2 text-white text-xs font-medium rounded-lg transition-colors duration-200 ${
              report.status === 'rejected'
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {report.status === 'rejected' ? 'Undo' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}