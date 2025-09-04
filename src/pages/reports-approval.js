import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
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
  BellIcon
} from '@heroicons/react/24/outline';

export default function ReportsApproval() {
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('reports');
  const [chatReports, setChatReports] = useState([]);
  const [chatRemovals, setChatRemovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [removalsLoading, setRemovalsLoading] = useState(true);
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(''); // 'report' or 'removal'

  useEffect(() => {
    checkAdminAuth();
    fetchChatReports();
    fetchChatRemovals();
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

  if (isLoading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <ShieldCheckIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-red-800">Reports Management</h1>
                <p className="text-sm text-gray-600">Review chat reports and removals</p>
              </div>
            </div>
            
            <button
              onClick={() => signOut(auth)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'reports'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Chat Reports ({chatReports.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('removals')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'removals'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Chat Removals ({chatRemovals.length})
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
              ) : chatReports.length === 0 ? (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No chat reports found</p>
                  <p className="text-sm text-gray-400 mt-2">Reported chats will appear here</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {chatReports.map((report) => (
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
              ) : chatRemovals.length === 0 ? (
                <div className="text-center py-8">
                  <TrashIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No chat removals found</p>
                  <p className="text-sm text-gray-400 mt-2">Removed chats will appear here</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {chatRemovals.map((removal) => (
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