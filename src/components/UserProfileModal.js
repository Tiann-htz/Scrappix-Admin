import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  XMarkIcon,
  UserIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CalendarIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export default function UserProfileModal({ userId, isOpen, onClose }) {
  const [userProfile, setUserProfile] = useState(null);
  const [reportCounts, setReportCounts] = useState({
    reportedBy: 0,
    reportedAgainst: 0,
    removedBy: 0,
    removedAgainst: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
      fetchReportCounts();
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchReportCounts = async () => {
    try {
      setLoading(true);
      
      // Count reports made by this user
      const reportsByUserQuery = query(
        collection(db, 'chatReports'),
        where('reportedByUserId', '==', userId)
      );
      const reportsByUserSnapshot = await getDocs(reportsByUserQuery);
      
      // Count reports against this user
      const reportsAgainstUserQuery = query(
        collection(db, 'chatReports'),
        where('reportedPersonId', '==', userId)
      );
      const reportsAgainstUserSnapshot = await getDocs(reportsAgainstUserQuery);
      
      // Count removals made by this user
      const removalsByUserQuery = query(
        collection(db, 'chatRemovals'),
        where('removedByUserId', '==', userId)
      );
      const removalsByUserSnapshot = await getDocs(removalsByUserQuery);
      
      // Count removals against this user
      const removalsAgainstUserQuery = query(
        collection(db, 'chatRemovals'),
        where('removedPersonId', '==', userId)
      );
      const removalsAgainstUserSnapshot = await getDocs(removalsAgainstUserQuery);
      
      setReportCounts({
        reportedBy: reportsByUserSnapshot.size,
        reportedAgainst: reportsAgainstUserSnapshot.size,
        removedBy: removalsByUserSnapshot.size,
        removedAgainst: removalsAgainstUserSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching report counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto max-w-sm md:max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">User Profile</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-8">
          {loading ? (
            <div className="text-center py-8 md:py-12">
              <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading user profile...</p>
            </div>
          ) : userProfile ? (
            <div className="space-y-6 md:space-y-8">
              {/* Mobile Layout */}
              <div className="block md:hidden">
                {/* Profile Picture and Basic Info */}
                <div className="text-center mb-6">
                  <div className="mx-auto h-20 w-20 rounded-full overflow-hidden bg-gray-200 mb-4">
                    {userProfile.imageUrl ? (
                      <img
                        src={userProfile.imageUrl}
                        alt={userProfile.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-100">
                        <UserIcon className="h-10 w-10 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">{userProfile.fullName}</h4>
                  {userProfile.nickname && (
                    <p className="text-gray-600">"{userProfile.nickname}"</p>
                  )}
                </div>

                {/* User Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-sm text-gray-900">{userProfile.email}</p>
                    </div>
                  </div>

                  {userProfile.address && (
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Address</p>
                        <p className="text-sm text-gray-900">{userProfile.address}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Member Since</p>
                      <p className="text-sm text-gray-900">{formatDate(userProfile.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Report & Removal Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-4 text-center">Activity Summary</h5>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Reports Made</p>
                      <p className="text-lg font-bold text-orange-600">{reportCounts.reportedBy}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Reported</p>
                      <p className="text-lg font-bold text-red-600">{reportCounts.reportedAgainst}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-center">
                      <TrashIcon className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Chats Removed</p>
                      <p className="text-lg font-bold text-blue-600">{reportCounts.removedBy}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-center">
                      <TrashIcon className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Removed From</p>
                      <p className="text-lg font-bold text-purple-600">{reportCounts.removedAgainst}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <div className="grid grid-cols-3 gap-8">
                  {/* Left Column - Profile */}
                  <div className="col-span-1">
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <div className="mx-auto h-32 w-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                        {userProfile.imageUrl ? (
                          <img
                            src={userProfile.imageUrl}
                            alt={userProfile.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-100">
                            <UserIcon className="h-16 w-16 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">{userProfile.fullName}</h4>
                      {userProfile.nickname && (
                        <p className="text-gray-600 text-lg mb-4">"{userProfile.nickname}"</p>
                      )}
                      <div className="text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 inline mr-2" />
                        Member since {formatDate(userProfile.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Details */}
                  <div className="col-span-1">
                    <div className="space-y-6">
                      <div>
                        <h5 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h5>
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Email Address</p>
                              <p className="text-sm text-gray-900">{userProfile.email}</p>
                            </div>
                          </div>

                          {userProfile.address && (
                            <div className="flex items-start space-x-3">
                              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">Address</p>
                                <p className="text-sm text-gray-900">{userProfile.address}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Statistics */}
                  <div className="col-span-1">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4 text-center">Activity Summary</h5>
                      
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                          <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Reports Made</p>
                            <p className="text-xl font-bold text-orange-600">{reportCounts.reportedBy}</p>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                          <ExclamationTriangleIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Times Reported</p>
                            <p className="text-xl font-bold text-red-600">{reportCounts.reportedAgainst}</p>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                          <TrashIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Chats Removed</p>
                            <p className="text-xl font-bold text-blue-600">{reportCounts.removedBy}</p>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                          <TrashIcon className="h-8 w-8 text-purple-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Removed From Chats</p>
                            <p className="text-xl font-bold text-purple-600">{reportCounts.removedAgainst}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <UserIcon className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">User profile not found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-8 py-4 md:py-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full md:w-auto md:px-8 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}