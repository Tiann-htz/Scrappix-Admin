import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const logAdminActivity = async (activityData) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const activityLog = {
      adminId: user.uid,
      adminEmail: user.email,
      timestamp: new Date(),
      ...activityData
    };

    // Add to admin's activity subcollection
    await addDoc(collection(db, 'userAdmin', user.uid, 'recentActivities'), activityLog);

  } catch (error) {
    console.error('Error logging admin activity:', error);
    // Don't throw error to prevent disrupting main functionality
  }
};

// Activity types and their categories
export const ACTIVITY_TYPES = {
  // User Management Activities
  USER_ACCOUNT_DISABLED: 'user_account_disabled',
  USER_ACCOUNT_ENABLED: 'user_account_enabled',
  USER_ACCOUNT_DELETED: 'user_account_deleted',
  USER_PROFILE_UPDATED: 'user_profile_updated',

  // Reports Moderation Activities
  CHAT_REPORT_REVIEWED: 'chat_report_reviewed',
  CHAT_REPORT_RESOLVED: 'chat_report_resolved',
  CHAT_REPORT_DISMISSED: 'chat_report_dismissed',
  CHAT_REMOVED_BY_ADMIN: 'chat_removed_by_admin',
  CHAT_RESTORED: 'chat_restored',

  // Marketplace Approval Activities
  MARKETPLACE_ITEM_APPROVED: 'marketplace_item_approved',
  MARKETPLACE_ITEM_REJECTED: 'marketplace_item_rejected',
  MARKETPLACE_ITEM_REMOVED: 'marketplace_item_removed',
  MARKETPLACE_ITEM_DELETED: 'marketplace_item_deleted',
  MARKETPLACE_ITEM_RESTORED: 'marketplace_item_restored'
};

export const ACTIVITY_PAGES = {
  USER_MANAGEMENT: 'User Management',
  REPORTS_MODERATION: 'Reports Moderation',
  MARKETPLACE_APPROVAL: 'Marketplace Approval',
  MARKETPLACE_ARCHIVE: 'Marketplace Archive',
  DASHBOARD: 'Dashboard'
};

// Helper function to get activity description
export const getActivityDescription = (activityType, details) => {
  switch (activityType) {
    // User Management
    case ACTIVITY_TYPES.USER_ACCOUNT_DISABLED:
      return `Disabled user account: ${details.userName || details.userEmail}`;
    case ACTIVITY_TYPES.USER_ACCOUNT_ENABLED:
      return `Enabled user account: ${details.userName || details.userEmail}`;
    case ACTIVITY_TYPES.USER_ACCOUNT_DELETED:
      return `Permanently deleted user account: ${details.userName || details.userEmail}`;
    case ACTIVITY_TYPES.USER_PROFILE_UPDATED:
      return `Updated user profile: ${details.userName || details.userEmail}`;

    // Reports Moderation
    case ACTIVITY_TYPES.CHAT_REPORT_REVIEWED:
      return `Reviewed chat report for: ${details.productName || 'Unknown Product'}`;
    case ACTIVITY_TYPES.CHAT_REPORT_RESOLVED:
      return `Resolved chat report for: ${details.productName || 'Unknown Product'}`;
    case ACTIVITY_TYPES.CHAT_REPORT_DISMISSED:
      return `Dismissed chat report for: ${details.productName || 'Unknown Product'}`;
    case ACTIVITY_TYPES.CHAT_REMOVED_BY_ADMIN:
      return `Removed chat for product: ${details.productName || 'Unknown Product'}`;
    case ACTIVITY_TYPES.CHAT_RESTORED:
      return `Restored chat for product: ${details.productName || 'Unknown Product'}`;

    // Marketplace Approval
    case ACTIVITY_TYPES.MARKETPLACE_ITEM_APPROVED:
      return `Approved marketplace item: ${details.productName || 'Unknown Product'}`;
    case ACTIVITY_TYPES.MARKETPLACE_ITEM_REJECTED:
      return `Rejected marketplace item: ${details.productName || 'Unknown Product'}`;
    case ACTIVITY_TYPES.MARKETPLACE_ITEM_REMOVED:
      return `Removed marketplace item: ${details.productName || 'Unknown Product'}`;
    case ACTIVITY_TYPES.MARKETPLACE_ITEM_DELETED:
      return `Permanently deleted marketplace item: ${details.productName || 'Unknown Product'}`;
    case ACTIVITY_TYPES.MARKETPLACE_ITEM_RESTORED:
      return `Restored marketplace item: ${details.productName || 'Unknown Product'}`;

    default:
      return 'Unknown activity';
  }
};

// Helper function to get activity icon and color
export const getActivityStyle = (activityType) => {
  switch (activityType) {
    // User Management - Blue theme
    case ACTIVITY_TYPES.USER_ACCOUNT_DISABLED:
      return { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: 'UserMinusIcon' };
    case ACTIVITY_TYPES.USER_ACCOUNT_ENABLED:
      return { color: 'text-green-600', bgColor: 'bg-green-100', icon: 'UserPlusIcon' };
    case ACTIVITY_TYPES.USER_ACCOUNT_DELETED:
      return { color: 'text-red-600', bgColor: 'bg-red-100', icon: 'TrashIcon' };
    case ACTIVITY_TYPES.USER_PROFILE_UPDATED:
      return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: 'PencilSquareIcon' };

    // Reports Moderation - Purple theme
    case ACTIVITY_TYPES.CHAT_REPORT_REVIEWED:
    case ACTIVITY_TYPES.CHAT_REPORT_RESOLVED:
    case ACTIVITY_TYPES.CHAT_REPORT_DISMISSED:
      return { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: 'DocumentMagnifyingGlassIcon' };
    case ACTIVITY_TYPES.CHAT_REMOVED_BY_ADMIN:
      return { color: 'text-red-600', bgColor: 'bg-red-100', icon: 'ChatBubbleLeftRightIcon' };
    case ACTIVITY_TYPES.CHAT_RESTORED:
      return { color: 'text-green-600', bgColor: 'bg-green-100', icon: 'ArrowUturnLeftIcon' };

    // Marketplace Approval - Green/Red theme
    case ACTIVITY_TYPES.MARKETPLACE_ITEM_APPROVED:
      return { color: 'text-green-600', bgColor: 'bg-green-100', icon: 'CheckCircleIcon' };
    case ACTIVITY_TYPES.MARKETPLACE_ITEM_REJECTED:
      return { color: 'text-red-600', bgColor: 'bg-red-100', icon: 'XCircleIcon' };
    case ACTIVITY_TYPES.MARKETPLACE_ITEM_REMOVED:
      return { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: 'ArchiveBoxXMarkIcon' };
    case ACTIVITY_TYPES.MARKETPLACE_ITEM_DELETED:
      return { color: 'text-red-600', bgColor: 'bg-red-100', icon: 'TrashIcon' };
    case ACTIVITY_TYPES.MARKETPLACE_ITEM_RESTORED:
      return { color: 'text-green-600', bgColor: 'bg-green-100', icon: 'ArrowUturnLeftIcon' };

    default:
      return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: 'InformationCircleIcon' };
  }
};