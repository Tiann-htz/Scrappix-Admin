// src/pages/dashboard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import ActivityIcon from '../components/ActivityIcon';
import { getActivityDescription, getActivityStyle } from '../utils/AdminActivityLogger';
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
    <button 
      onClick={() => router.push('/reports-approval')}
      className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
    >
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
              <div className="max-h-96 overflow-y-auto scrollbar-hide">
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