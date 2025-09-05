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
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-red-300 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Reported User - Main Highlight */}
<div className="mb-3">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-lg font-bold text-red-600 mb-1">{report.reportedPersonName}</h3>
      <p className="text-sm text-gray-500">({report.reportedPersonRole})</p>
    </div>
    <div className="ml-2 mr-8">
      {getStatusBadge(report.status)}
    </div>
  </div>
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
  disabled={report.status === 'approved'}
  className={`px-3 py-1.5 text-white text-xs font-medium rounded-md transition-colors duration-200 ${
    report.status === 'approved'
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-green-500 hover:bg-green-600'
  }`}
>
  {report.status === 'approved' ? 'Approved' : 'Approve'}
</button>
           <button
  onClick={handleRejectReport}
  className={`px-3 py-1.5 text-white text-xs font-medium rounded-md transition-colors duration-200 ${
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
    </div>
  );
}