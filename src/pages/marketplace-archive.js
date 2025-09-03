import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import MarketplaceItemModal from '../components/MarketplaceItemModal';
import { doc, getDoc, collection, query, where, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import { 
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function MarketplaceArchive() {
  const [adminData, setAdminData] = useState(null);
  const [rejectedItems, setRejectedItems] = useState([]);
  const [removedItems, setRemovedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('rejected');
  const [isLoading, setIsLoading] = useState(true);
  const [processingItems, setProcessingItems] = useState(new Set());
  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdminAuth();
    fetchArchivedItems();
  }, []);

  // Cleanup listeners on component unmount
  useEffect(() => {
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [unsubscribeFunctions]);

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

  const fetchArchivedItems = async () => {
    try {
      // Clean up any existing listeners
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      
      // Set up realtime listener for rejected items
      const rejectedQuery = query(collection(db, 'marketplaceItems'), where('status', '==', 'rejected'));
      const unsubscribeRejected = onSnapshot(rejectedQuery, (snapshot) => {
        const rejectedData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRejectedItems(rejectedData);
      }, (error) => {
        console.error('Error listening to rejected items:', error);
        toast.error('Error loading rejected items');
      });

      // Set up realtime listener for removed items
      const removedQuery = query(collection(db, 'marketplaceItems'), where('status', '==', 'removed'));
      const unsubscribeRemoved = onSnapshot(removedQuery, (snapshot) => {
        const removedData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRemovedItems(removedData);
      }, (error) => {
        console.error('Error listening to removed items:', error);
        toast.error('Error loading removed items');
      });

      // Store unsubscribe functions for cleanup
      setUnsubscribeFunctions([unsubscribeRejected, unsubscribeRemoved]);
      
    } catch (error) {
      console.error('Error setting up realtime listeners:', error);
      toast.error('Error loading archived items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!confirm(`Are you sure you want to permanently delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    setProcessingItems(prev => new Set(prev).add(itemId));
    
    try {
      await deleteDoc(doc(db, 'marketplaceItems', itemId));
      toast.success('Item permanently deleted');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Error deleting item');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
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

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unavailable';
    
    try {
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString();
      }
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return new Date(timestamp.toDate()).toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unavailable';
    }
  };

  const ItemCard = ({ item }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => handleItemClick(item)}
    >
      <div className="flex gap-6">
        {/* Image */}
        <div className="flex-shrink-0">
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <Image
              src={item.imageUrls[0]}
              alt={item.productName || 'Product'}
              width={120}
              height={120}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-30 h-30 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {item.productName || 'Unavailable'}
            </h3>
            {/* Status Badge */}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              item.status === 'rejected' 
                ? 'bg-red-100 text-red-800'
                : item.status === 'removed'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              <span>₱{item.price || 'Unavailable'}</span>
            </div>
            <div className="flex items-center">
              <TagIcon className="h-4 w-4 mr-1" />
              <span>{item.category || 'Unavailable'}</span>
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{item.location || 'Unavailable'}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatDate(item.postedAt)}</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Seller:</span> {item.sellerName || 'Unavailable'}
            </p>
            
            {/* Rejection/Removal Details */}
            {item.status === 'rejected' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <XCircleIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                    <p className="text-sm text-red-700 mt-1">{item.rejectedMessage || 'No reason provided'}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Rejected on {formatDate(item.rejectedAt)} by {item.rejectedBy}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {item.status === 'removed' && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Removal Reason:</p>
                    <p className="text-sm text-orange-700 mt-1">{item.removedMessage || 'No reason provided'}</p>
                    <p className="text-xs text-orange-600 mt-1">
                      Removed on {formatDate(item.removedAt)} by {item.removedBy}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {item.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Delete Action */}
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteItem(item.id, item.productName);
              }}
              disabled={processingItems.has(item.id)}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              {processingItems.has(item.id) ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading archived items...</p>
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
                onClick={() => router.push('/marketplace-approval')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <ArchiveBoxIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-red-800">Marketplace Archive</h1>
                <p className="text-sm text-gray-600">View rejected and removed marketplace items</p>
              </div>
              <div className="flex items-center ml-4">
                <div className={`h-2 w-2 rounded-full ${isRealTimeConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="ml-2 text-xs text-gray-500">
                  {isRealTimeConnected ? 'Live updates' : 'Connection lost'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('rejected')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rejected'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rejected ({rejectedItems.length})
              </button>
              <button
                onClick={() => setActiveTab('removed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'removed'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Removed ({removedItems.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Items Grid */}
        <div className="space-y-6">
          {activeTab === 'rejected' ? (
            rejectedItems.length > 0 ? (
              rejectedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-12">
                <XCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No rejected items in archive</p>
              </div>
            )
          ) : (
            removedItems.length > 0 ? (
              removedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-12">
                <ArchiveBoxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No removed items in archive</p>
              </div>
            )
          )}
        </div>
      </main>

      {/* Modal */}
      <MarketplaceItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}