import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import ChatReportItem from '../components/ChatReportItem';
import ChatRemovalItem from '../components/ChatRemovalItem';
import ReportsModal from '../components/ReportsModal';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ShieldCheckIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function ReportsApproval() {
const { user, adminData, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('reports');
  const [chatReports, setChatReports] = useState([]);
  const [chatRemovals, setChatRemovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [removalsLoading, setRemovalsLoading] = useState(true);
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChatReports, setFilteredChatReports] = useState([]);
  const [filteredChatRemovals, setFilteredChatRemovals] = useState([]);

 useEffect(() => {
  if (!authLoading && !user) {
    router.push('/');
    return;
  }
  
  if (user && adminData) {
    fetchChatReports();
    fetchChatRemovals();
    setIsLoading(false);
    setFilteredChatReports(chatReports);
    setFilteredChatRemovals(chatRemovals);
  }
}, [user, adminData, authLoading, router]);

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
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking admin auth:', error);
      toast.error('Authentication error');
      router.push('/');
    }
  };

  const fetchUserImage = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.imageUrl || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user image:', error);
    return null;
  }
};

const fetchProductImages = async (productId) => {
  try {
    const productDoc = await getDoc(doc(db, 'marketplaceItems', productId));
    if (productDoc.exists()) {
      const productData = productDoc.data();
      // Handle both imageUrls (array) and imageUrl (single) fields
      const images = productData.imageUrls || (productData.imageUrl ? [productData.imageUrl] : null);
      return images;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product images:', error);
    return null;
  }
};

  const fetchChatReports = async () => {
    try {
      setReportsLoading(true);
      const reportsQuery = query(
        collection(db, 'chatReports'),
        orderBy('timestamp', 'desc')
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      
      const reportsData = await Promise.all(
        reportsSnapshot.docs.map(async (docSnapshot) => {
          const reportData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };

          // Fetch user images
          const [reportedByImage, reportedPersonImage, productImages] = await Promise.all([
            fetchUserImage(reportData.reportedByUserId),
            fetchUserImage(reportData.reportedPersonId),
            fetchProductImages(reportData.productId)
          ]);

          reportData.reportedByUserImage = reportedByImage;
          reportData.reportedPersonImage = reportedPersonImage;
          reportData.productImages = productImages;

          return reportData;
        })
      );

      setChatReports(reportsData);
      setFilteredChatReports(reportsData);
    } catch (error) {
      console.error('Error fetching chat reports:', error);
      toast.error('Error loading chat reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchChatRemovals = async () => {
    try {
      setRemovalsLoading(true);
      const removalsQuery = query(
        collection(db, 'chatRemovals'),
        orderBy('timestamp', 'desc')
      );
      const removalsSnapshot = await getDocs(removalsQuery);
      
      const removalsData = await Promise.all(
        removalsSnapshot.docs.map(async (docSnapshot) => {
          const removalData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };

          // Fetch marketplace item status and user images
          const [marketplaceDoc, removedByImage, removedPersonImage, productImages] = await Promise.all([
            getDoc(doc(db, 'marketplaceItems', removalData.productId)),
            fetchUserImage(removalData.removedByUserId),
            fetchUserImage(removalData.removedPersonId),
            fetchProductImages(removalData.productId)
          ]);

          if (marketplaceDoc.exists()) {
            removalData.productStatus = marketplaceDoc.data().status || 'available';
          } else {
            removalData.productStatus = 'not found';
          }

          removalData.removedByUserImage = removedByImage;
          removalData.removedPersonImage = removedPersonImage;
          removalData.productImages = productImages;

          return removalData;
        })
      );

      setChatRemovals(removalsData);
      setFilteredChatRemovals(removalsData);
    } catch (error) {
      console.error('Error fetching chat removals:', error);
      toast.error('Error loading chat removals');
    } finally {
      setRemovalsLoading(false);
    }
  };

  const handleViewDetails = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setModalType('');
  };

  const handleLogout = async () => {
  try {
    await signOut();
    toast.success('Logged out successfully');
    router.push('/');
  } catch (error) {
    console.error('Error signing out:', error);
    toast.error('Error logging out');
  }
};

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'acknowledged': 'bg-blue-100 text-blue-800',
  'available': 'bg-blue-100 text-blue-800',
  'reserved': 'bg-orange-100 text-orange-800',
  'sold': 'bg-gray-100 text-gray-800',
  'not found': 'bg-red-100 text-red-800',
  'error loading': 'bg-red-100 text-red-800'
};

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'not found' ? 'Product Not Found' : 
         status === 'error loading' ? 'Error Loading Status' :
         status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Search functionality
  const filterData = (query) => {
    const lowercaseQuery = query.toLowerCase().trim();
    
    if (!lowercaseQuery) {
      setFilteredChatReports(chatReports);
      setFilteredChatRemovals(chatRemovals);
      return;
    }

    // Filter chat reports
    const filteredReports = chatReports.filter(report => 
      report.reportedPersonName?.toLowerCase().includes(lowercaseQuery) ||
      report.reportedByUserName?.toLowerCase().includes(lowercaseQuery) ||
      report.productName?.toLowerCase().includes(lowercaseQuery) ||
      report.reportCategory?.toLowerCase().includes(lowercaseQuery)
    );

    // Filter chat removals
    const filteredRemovals = chatRemovals.filter(removal => 
      removal.removedPersonName?.toLowerCase().includes(lowercaseQuery) ||
      removal.removedByUserName?.toLowerCase().includes(lowercaseQuery) ||
      removal.productName?.toLowerCase().includes(lowercaseQuery)
    );

    setFilteredChatReports(filteredReports);
    setFilteredChatRemovals(filteredRemovals);
  };

  // Search handler
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterData(query);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <ShieldCheckIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-red-800">Reports Management</h1>
                <p className="text-sm text-gray-600">Review chat reports and removals</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex gap-4 items-center justify-center">
            {/* Search Input */}
            <div className="relative flex-2 max-w-md sm:max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search reports, users, or products..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-700 text-sm sm:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    filterData('');
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                </button>
              )}
            </div>

            {/* Clear Search Button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  filterData('');
                }}
                className="px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                {activeTab === 'reports' 
                  ? `Found ${filteredChatReports.length} report${filteredChatReports.length !== 1 ? 's' : ''}`
                  : `Found ${filteredChatRemovals.length} removal${filteredChatRemovals.length !== 1 ? 's' : ''}`
                } matching "${searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Chat Reports ({searchQuery ? filteredChatReports.length : chatReports.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('removals')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                  activeTab === 'removals'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Chat Removals ({searchQuery ? filteredChatRemovals.length : chatRemovals.length})
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'reports' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Chat Reports</h2>
              <p className="text-sm text-gray-600 mt-1">Review reported chat conversations</p>
            </div>
            <div className="p-6">
              {reportsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading chat reports...</p>
                </div>
              ) : (searchQuery ? filteredChatReports.length === 0 : chatReports.length === 0) ? (
                <div className="text-center py-8">
                  {searchQuery ? (
                    <>
                      <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No reports match your search</p>
                      <p className="text-sm text-gray-400 mt-2">Try adjusting your search terms</p>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No chat reports found</p>
                      <p className="text-sm text-gray-400 mt-2">Reported chats will appear here</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto space-y-3">
                  {(searchQuery ? filteredChatReports : chatReports).map((report) => (
                    <ChatReportItem 
                      key={report.id} 
                      report={report}
                      formatTimestamp={formatTimestamp}
                      getStatusBadge={getStatusBadge}
                      onUpdate={fetchChatReports}
                      onViewDetails={(item) => handleViewDetails(item, 'report')}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Chat Removals</h2>
              <p className="text-sm text-gray-600 mt-1">Manage removed chat conversations</p>
            </div>
            <div className="p-6">
              {removalsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading chat removals...</p>
                </div>
              ) : (searchQuery ? filteredChatRemovals.length === 0 : chatRemovals.length === 0) ? (
                <div className="text-center py-8">
                  {searchQuery ? (
                    <>
                      <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No removals match your search</p>
                      <p className="text-sm text-gray-400 mt-2">Try adjusting your search terms</p>
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No chat removals found</p>
                      <p className="text-sm text-gray-400 mt-2">Removed chats will appear here</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto space-y-3">
                  {(searchQuery ? filteredChatRemovals : chatRemovals).map((removal) => (
                    <ChatRemovalItem 
                      key={removal.id} 
                      removal={removal}
                      formatTimestamp={formatTimestamp}
                      getStatusBadge={getStatusBadge}
                      onUpdate={fetchChatRemovals}
                      onViewDetails={(item) => handleViewDetails(item, 'removal')}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Modal */}
        {selectedItem && (
          <ReportsModal 
            item={selectedItem}
            type={modalType}
            isOpen={!!selectedItem}
            onClose={closeModal}
            formatTimestamp={formatTimestamp}
            getStatusBadge={getStatusBadge}
          />
        )}
      </main>
    </div>
  );
}