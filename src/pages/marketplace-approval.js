import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import MarketplaceItemModal from '../components/MarketplaceItemModal';
import RejectItemModal from '../components/RejectItemModal';
import RemoveItemModal from '../components/RemoveItemModal';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, addDoc, onSnapshot, deleteField } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import { 
  ShieldCheckIcon,
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  CurrencyDollarIcon,
  TrashIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

export default function MarketplaceApproval() {
  const [adminData, setAdminData] = useState(null);
  const [pendingItems, setPendingItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [processingItems, setProcessingItems] = useState(new Set());
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [itemToReject, setItemToReject] = useState(null);
  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState([]);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [rejectFromApprovedModalOpen, setRejectFromApprovedModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [itemToRejectFromApproved, setItemToRejectFromApproved] = useState(null);

  useEffect(() => {
    checkAdminAuth();
    fetchMarketplaceItems();
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

  const fetchMarketplaceItems = async () => {
    try {
      // Clean up any existing listeners
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      
      // Set up realtime listener for pending items
      const pendingQuery = query(collection(db, 'marketplaceItems'), where('status', '==', 'pending'));
      const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        const pendingData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingItems(pendingData);
      }, (error) => {
        console.error('Error listening to pending items:', error);
        toast.error('Error loading pending items');
      });

      // Set up realtime listener for available items (excluding removed)
      const availableQuery = query(collection(db, 'marketplaceItems'), where('status', '==', 'available'));
      const unsubscribeAvailable = onSnapshot(availableQuery, (snapshot) => {
        const availableData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAvailableItems(availableData);
      }, (error) => {
        console.error('Error listening to available items:', error);
        toast.error('Error loading available items');
      });

      // Store unsubscribe functions for cleanup
      setUnsubscribeFunctions([unsubscribePending, unsubscribeAvailable]);
      
    } catch (error) {
      console.error('Error setting up realtime listeners:', error);
      toast.error('Error loading marketplace items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (itemId) => {
    setProcessingItems(prev => new Set(prev).add(itemId));
    
    try {
      await updateDoc(doc(db, 'marketplaceItems', itemId), {
        status: 'available',
        approvedAt: new Date(),
        approvedBy: adminData?.email || 'admin'
      });

      // Create notification for the seller
      const approvedItem = pendingItems.find(item => item.id === itemId);
      if (approvedItem) {
        await addDoc(collection(db, 'marketplaceItemsNotifications'), {
          userId: approvedItem.sellerId,
          itemId: itemId,
          productName: approvedItem.productName,
          status: 'approved',
          message: 'Your item has been approved and is now available in the marketplace.',
          timestamp: new Date(),
          isRead: false
        });
      }
      
      toast.success('Item approved successfully');
      // Remove manual state updates - realtime listeners will handle this automatically
    } catch (error) {
      console.error('Error approving item:', error);
      toast.error('Error approving item');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleReject = async (itemId, rejectionMessage) => {
  setProcessingItems(prev => new Set(prev).add(itemId));
  
  try {
    const rejectionData = {
      status: 'rejected',
      rejectedMessage: rejectionMessage,
      rejectedAt: new Date(),
      rejectedBy: adminData?.email || 'admin'
    };

    // Check if item was previously approved and remove approval fields
    const itemDoc = await getDoc(doc(db, 'marketplaceItems', itemId));
    const itemData = itemDoc.data();
    
    if (itemData.approvedBy || itemData.approvedAt) {
      rejectionData.approvedBy = deleteField();
      rejectionData.approvedAt = deleteField();
    }

    await updateDoc(doc(db, 'marketplaceItems', itemId), rejectionData);

    // Create notification for the seller
    const rejectedItem = pendingItems.find(item => item.id === itemId);
    if (rejectedItem) {
      await addDoc(collection(db, 'marketplaceItemsNotifications'), {
        userId: rejectedItem.sellerId,
        itemId: itemId,
        productName: rejectedItem.productName,
        status: 'rejected',
        message: rejectionMessage,
        timestamp: new Date(),
        isRead: false
      });
    }
    
    toast.success('Item rejected successfully');
  } catch (error) {
    console.error('Error rejecting item:', error);
    toast.error('Error rejecting item');
  } finally {
    setProcessingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  }
};

  const handleRemoveItem = async (itemId, removalMessage) => {
  setProcessingItems(prev => new Set(prev).add(itemId));
  
  try {
    const removalData = {
      status: 'removed',
      removedMessage: removalMessage,
      removedAt: new Date(),
      removedBy: adminData?.email || 'admin',
      // Remove approval fields since item is being removed
      approvedBy: deleteField(),
      approvedAt: deleteField()
    };

    await updateDoc(doc(db, 'marketplaceItems', itemId), removalData);

    // Create notification for the seller
    const removedItem = availableItems.find(item => item.id === itemId);
    if (removedItem) {
      await addDoc(collection(db, 'marketplaceItemsNotifications'), {
        userId: removedItem.sellerId,
        itemId: itemId,
        productName: removedItem.productName,
        status: 'removed',
        message: `Sorry for the inconvenience. Your approved item has been removed from the marketplace. Reason: ${removalMessage}`,
        timestamp: new Date(),
        isRead: false
      });
    }
    
    toast.success('Item removed from marketplace');
  } catch (error) {
    console.error('Error removing item:', error);
    toast.error('Error removing item');
  } finally {
    setProcessingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  }
};

  const handleRejectFromApproved = async (itemId, rejectionMessage) => {
  setProcessingItems(prev => new Set(prev).add(itemId));
  
  try {
    const rejectionData = {
      status: 'rejected',
      rejectedMessage: rejectionMessage,
      rejectedAt: new Date(),
      rejectedBy: adminData?.email || 'admin',
      // Remove approval fields completely
      approvedBy: deleteField(),
      approvedAt: deleteField()
    };

    await updateDoc(doc(db, 'marketplaceItems', itemId), rejectionData);

    // Create notification for the seller
    const rejectedItem = availableItems.find(item => item.id === itemId);
    if (rejectedItem) {
      await addDoc(collection(db, 'marketplaceItemsNotifications'), {
        userId: rejectedItem.sellerId,
        itemId: itemId,
        productName: rejectedItem.productName,
        status: 'rejected',
        message: `Sorry for the late notice. After further review, your previously approved item has been rejected. Reason: ${rejectionMessage}`,
        timestamp: new Date(),
        isRead: false
      });
    }
    
    toast.success('Item moved back to rejected status');
  } catch (error) {
    console.error('Error rejecting approved item:', error);
    toast.error('Error processing rejection');
  } finally {
    setProcessingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  }
};

  const openRejectModal = (item) => {
    setItemToReject(item);
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setItemToReject(null);
    setRejectModalOpen(false);
  };

  const openRemoveModal = (item) => {
    setItemToRemove(item);
    setRemoveModalOpen(true);
  };

  const closeRemoveModal = () => {
    setItemToRemove(null);
    setRemoveModalOpen(false);
  };

  const openRejectFromApprovedModal = (item) => {
    setItemToRejectFromApproved(item);
    setRejectFromApprovedModalOpen(true);
  };

  const closeRejectFromApprovedModal = () => {
    setItemToRejectFromApproved(null);
    setRejectFromApprovedModalOpen(false);
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
      // Handle number timestamp (milliseconds)
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString();
      }
      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return new Date(timestamp.toDate()).toLocaleDateString();
      }
      // Handle regular Date object
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {item.productName || 'Unavailable'}
          </h3>
          
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
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Description:</span> {item.description || 'No description provided'}
            </p>
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

          {/* Actions for pending items */}
          {activeTab === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(item.id);
                }}
                disabled={processingItems.has(item.id)}
                className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                {processingItems.has(item.id) ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openRejectModal(item);
                }}
                disabled={processingItems.has(item.id)}
                className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                {processingItems.has(item.id) ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          )}

          {/* Actions for available/approved items */}
          {activeTab === 'available' && (
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openRemoveModal(item);
                }}
                disabled={processingItems.has(item.id)}
                className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                {processingItems.has(item.id) ? 'Removing...' : 'Remove'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openRejectFromApprovedModal(item);
                }}
                disabled={processingItems.has(item.id)}
                className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                {processingItems.has(item.id) ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading marketplace items...</p>
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
              <ShieldCheckIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-green-800">Marketplace Approval</h1>
                <p className="text-sm text-gray-600">Review and approve marketplace items</p>
              </div>
            </div>
            
            
            <div className="flex items-center space-x-4">
  <button
    onClick={() => router.push('/marketplace-archive')}
    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
  >
    <ArchiveBoxIcon className="h-4 w-4 mr-2" />
    Archive
  </button>
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
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending ({pendingItems.length})
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Approved ({availableItems.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Items Grid */}
        <div className="space-y-6">
          {activeTab === 'pending' ? (
            pendingItems.length > 0 ? (
              pendingItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending items to review</p>
              </div>
            )
          ) : (
            availableItems.length > 0 ? (
              availableItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-12">
                <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No available items</p>
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
      {/* Reject Modal */}
      <RejectItemModal
        item={itemToReject}
        isOpen={rejectModalOpen}
        onClose={closeRejectModal}
        onReject={handleReject}
      />
      {/* Remove Modal */}
      <RemoveItemModal
        item={itemToRemove}
        isOpen={removeModalOpen}
        onClose={closeRemoveModal}
        onRemove={handleRemoveItem}
      />
      {/* Reject from Approved Modal */}
      <RejectItemModal
        item={itemToRejectFromApproved}
        isOpen={rejectFromApprovedModalOpen}
        onClose={closeRejectFromApprovedModal}
        onReject={handleRejectFromApproved}
      />
    </div>
  );
}