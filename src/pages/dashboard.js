// src/pages/dashboard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getActivityDescription, getActivityStyle } from '../components/AdminActivityLogger';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ShieldCheckIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  EyeIcon,
  BellIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingReports: 0,
    pendingMarketplace: 0,
    totalScans: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdminAuth();
    fetchDashboardStats();
    
    // Set up activities listener
    const unsubscribe = fetchRecentActivities();
    
    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const checkAdminAuth = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push('/');
      return;
    }

    try {
      const adminDoc = await getDoc(doc(db, 'userAdmin', user.uid));
      if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
        toast.error('Unauthorized access');
        await signOut(auth);
        router.push('/');
        return;
      }
      
      setAdminData(adminDoc.data());
    } catch (error) {
      console.error('Error checking admin auth:', error);
      toast.error('Authentication error');
      router.push('/');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // Get pending reports
      const reportsQuery = query(collection(db, 'chatReports'), where('status', '==', 'pending'));
      const reportsSnapshot = await getDocs(reportsQuery);
      
      // Get pending marketplace items
      const marketplaceQuery = query(collection(db, 'marketplaceItems'), where('status', '==', 'pending'));
      const marketplaceSnapshot = await getDocs(marketplaceQuery);
      
      // Get total scans
      const scansSnapshot = await getDocs(collection(db, 'scannedMaterials'));
      
      setStats({
        totalUsers: usersSnapshot.size,
        pendingReports: reportsSnapshot.size,
        pendingMarketplace: marketplaceSnapshot.size,
        totalScans: scansSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivities = () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Create query for recent activities (newest first, limit to 10)
      const activitiesQuery = query(
        collection(db, 'userAdmin', user.uid, 'recentActivities'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentActivities(activities);
        setActivitiesLoading(false);
      }, (error) => {
        console.error('Error fetching activities:', error);
        setActivitiesLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up activities listener:', error);
      setActivitiesLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error logging out');
    }
  };

  // Icon components for activities
  const ActivityIcon = ({ iconName, className }) => {
    const icons = {
      UserMinusIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      ),
      UserPlusIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      ),
      CheckCircleIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      XCircleIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      TrashIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      ),
      PencilSquareIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
      ArchiveBoxXMarkIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      ArrowUturnLeftIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
      ),
      DocumentMagnifyingGlassIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      ChatBubbleLeftRightIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
      InformationCircleIcon: () => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      )
    };

    const IconComponent = icons[iconName] || icons.InformationCircleIcon;
    return <IconComponent />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: '#4CAF50',
              color: 'white',
            },
          },
          error: {
            style: {
              background: '#F44336',
              color: 'white',
            },
          },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-green-800">Scrappix Admin</h1>
                <p className="text-sm text-gray-600">Welcome back, {adminData?.fullName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <BellIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          {/* Pending Reports */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
              </div>
            </div>
          </div>

          {/* Pending Marketplace */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Marketplace</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingMarketplace}</p>
              </div>
            </div>
          </div>

          {/* Total Scans */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalScans}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="text-center">
              <UserGroupIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600 mb-4">Manage user accounts and permissions</p>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                Manage Users
              </button>
            </div>
          </div>

          {/* Reports Moderation */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports Moderation</h3>
              <p className="text-gray-600 mb-4">Review and moderate user reports</p>
              <button className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                Review Reports
              </button>
            </div>
          </div>

          {/* Marketplace Approval */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="text-center">
              <DocumentCheckIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketplace Approval</h3>
              <p className="text-gray-600 mb-4">Approve pending marketplace posts</p>
              <button 
                onClick={() => router.push('/marketplace-approval')}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Approve Posts
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {activitiesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading recent activities...</p>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity to display</p>
                <p className="text-sm text-gray-400 mt-2">Activity will appear here as you perform admin actions</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentActivities.map((activity, activityIdx) => {
                      const style = getActivityStyle(activity.activityType);
                      
                      return (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {activityIdx !== recentActivities.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`${style.bgColor} ${style.color} h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white`}>
                                  <ActivityIcon iconName={style.icon} className="h-5 w-5" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-900">
                                    {getActivityDescription(activity.activityType, activity.details)}
                                  </p>
                                  <div className="mt-1 space-y-1">
                                    {activity.page && (
                                      <p className="text-xs text-blue-600 font-medium">Page: {activity.page}</p>
                                    )}
                                    {activity.details?.category && (
                                      <p className="text-xs text-gray-500">Category: {activity.details.category}</p>
                                    )}
                                    {activity.details?.price && (
                                      <p className="text-xs text-gray-500">Price: ₱{activity.details.price}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  <time>{formatTimestamp(activity.timestamp)}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}