import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import MarketplaceItemModal from '../components/MarketplaceItemModal';
import RejectItemModal from '../components/RejectItemModal';
import RemoveItemModal from '../components/RemoveItemModal';
import FilterModal from '../components/FilterModal';
import { logAdminActivity, ACTIVITY_TYPES, ACTIVITY_PAGES } from '../components/AdminActivityLogger';
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
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  FunnelIcon
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
  const [searchTerm, setSearchTerm] = useState('');
const [filteredPendingItems, setFilteredPendingItems] = useState([]);
const [filteredAvailableItems, setFilteredAvailableItems] = useState([]);
const [filterModalOpen, setFilterModalOpen] = useState(false);
const [appliedFilters, setAppliedFilters] = useState({
  category: '',
  priceMin: '',
  priceMax: '',
  location: '',
  dateFrom: '',
  dateTo: '',
  sellerName: ''
});
const [hasActiveFilters, setHasActiveFilters] = useState(false);

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

 // Search and filter effect
useEffect(() => {
  const filterAndSearchItems = (items, searchTerm, filters) => {
    let filteredItems = items;

    // Apply filters first
    if (filters.category) {
      filteredItems = filteredItems.filter(item => 
        item.category && item.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.priceMin || filters.priceMax) {
      filteredItems = filteredItems.filter(item => {
        const price = parseFloat(item.price) || 0;
        const minPrice = parseFloat(filters.priceMin) || 0;
        const maxPrice = parseFloat(filters.priceMax) || Infinity;
        return price >= minPrice && price <= maxPrice;
      });
    }

    if (filters.location) {
      filteredItems = filteredItems.filter(item => 
        item.location && item.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.sellerName) {
      filteredItems = filteredItems.filter(item => 
        item.sellerName && item.sellerName.toLowerCase().includes(filters.sellerName.toLowerCase())
      );
    }

    if (filters.dateFrom || filters.dateTo) {
      filteredItems = filteredItems.filter(item => {
        if (!item.postedAt) return false;
        
        let itemDate;
        try {
          if (typeof item.postedAt === 'number') {
            itemDate = new Date(item.postedAt);
          } else if (item.postedAt.toDate && typeof item.postedAt.toDate === 'function') {
            itemDate = new Date(item.postedAt.toDate());
          } else {
            itemDate = new Date(item.postedAt);
          }
          
          const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
          const toDate = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59') : null;
          
          if (fromDate && itemDate < fromDate) return false;
          if (toDate && itemDate > toDate) return false;
          
          return true;
        } catch (error) {
          return false;
        }
      });
    }

    // Then apply search filter
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase().trim();
      filteredItems = filteredItems.filter(item => 
        (item.productName && item.productName.toLowerCase().includes(lowercaseSearch)) ||
        (item.sellerName && item.sellerName.toLowerCase().includes(lowercaseSearch)) ||
        (item.category && item.category.toLowerCase().includes(lowercaseSearch)) ||
        (item.location && item.location.toLowerCase().includes(lowercaseSearch)) ||
        (item.description && item.description.toLowerCase().includes(lowercaseSearch)) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowercaseSearch))) ||
        (item.price && item.price.toString().includes(lowercaseSearch))
      );
    }

    return filteredItems;
  };

  setFilteredPendingItems(filterAndSearchItems(pendingItems, searchTerm, appliedFilters));
  setFilteredAvailableItems(filterAndSearchItems(availableItems, searchTerm, appliedFilters));
}, [pendingItems, availableItems, searchTerm, appliedFilters]);

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

      // Log admin activity
      await logAdminActivity({
        activityType: ACTIVITY_TYPES.MARKETPLACE_ITEM_APPROVED,
        page: ACTIVITY_PAGES.MARKETPLACE_APPROVAL,
        details: {
          itemId: itemId,
          productName: approvedItem.productName,
          sellerId: approvedItem.sellerId,
          sellerName: approvedItem.sellerName,
          category: approvedItem.category,
          price: approvedItem.price
        },
        description: `Approved marketplace item: ${approvedItem.productName}`
      });
    }
    
    toast.success('Item approved successfully');
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

      // Log admin activity
      await logAdminActivity({
        activityType: ACTIVITY_TYPES.MARKETPLACE_ITEM_REJECTED,
        page: ACTIVITY_PAGES.MARKETPLACE_APPROVAL,
        details: {
          itemId: itemId,
          productName: rejectedItem.productName,
          sellerId: rejectedItem.sellerId,
          sellerName: rejectedItem.sellerName,
          rejectionReason: rejectionMessage,
          category: rejectedItem.category,
          price: rejectedItem.price
        },
        description: `Rejected marketplace item: ${rejectedItem.productName}`
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

      // Log admin activity
      await logAdminActivity({
        activityType: ACTIVITY_TYPES.MARKETPLACE_ITEM_REMOVED,
        page: ACTIVITY_PAGES.MARKETPLACE_APPROVAL,
        details: {
          itemId: itemId,
          productName: removedItem.productName,
          sellerId: removedItem.sellerId,
          sellerName: removedItem.sellerName,
          removalReason: removalMessage,
          category: removedItem.category,
          price: removedItem.price
        },
        description: `Removed marketplace item: ${removedItem.productName}`
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

      // Log admin activity
      await logAdminActivity({
        activityType: ACTIVITY_TYPES.MARKETPLACE_ITEM_REJECTED,
        page: ACTIVITY_PAGES.MARKETPLACE_APPROVAL,
        details: {
          itemId: itemId,
          productName: rejectedItem.productName,
          sellerId: rejectedItem.sellerId,
          sellerName: rejectedItem.sellerName,
          rejectionReason: rejectionMessage,
          category: rejectedItem.category,
          price: rejectedItem.price,
          wasApproved: true // Flag to indicate this was previously approved
        },
        description: `Rejected previously approved item: ${rejectedItem.productName}`
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

  const openFilterModal = () => {
  setFilterModalOpen(true);
};

const closeFilterModal = () => {
  setFilterModalOpen(false);
};

const handleApplyFilter = (filters) => {
  setAppliedFilters(filters);
  
  // Check if any filter has a value
  const hasFilters = Object.values(filters).some(value => value !== '');
  setHasActiveFilters(hasFilters);
};

const handleClearAllFilters = () => {
  const clearedFilters = {
    category: '',
    priceMin: '',
    priceMax: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    sellerName: ''
  };
  setAppliedFilters(clearedFilters);
  setHasActiveFilters(false);
  setSearchTerm('');
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
    className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
    onClick={() => handleItemClick(item)}
  >
    {/* Mobile Layout (stacked) */}
    <div className="flex flex-col sm:hidden space-y-3">
      {/* Top row - Image and basic info */}
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <Image
              src={item.imageUrls[0]}
              alt={item.productName || 'Product'}
              width={50}
              height={50}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {item.productName || 'Unavailable'}
          </h3>
          <p className="text-xs text-gray-600 truncate">
            <span className="font-medium">Seller:</span> {item.sellerName || 'Unavailable'}
          </p>
        </div>
      </div>

      {/* Bottom row - Category, Date, and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1 text-xs text-gray-600 flex-1 min-w-0">
          <span className="truncate">
            <span className="font-medium">Category:</span> {item.category || 'Unavailable'}
          </span>
          <span className="truncate">
            <span className="font-medium">Date:</span> {formatDate(item.postedAt)}
          </span>
        </div>
        
        {/* Mobile Action buttons */}
        <div className="flex flex-col space-y-1 ml-2">
          {activeTab === 'pending' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(item.id);
                }}
                disabled={processingItems.has(item.id)}
                className="flex items-center justify-center px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded transition-colors duration-200 disabled:opacity-50 min-w-16"
              >
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                {processingItems.has(item.id) ? 'Wait...' : 'Approve'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openRejectModal(item);
                }}
                disabled={processingItems.has(item.id)}
                className="flex items-center justify-center px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors duration-200 disabled:opacity-50 min-w-16"
              >
                <XCircleIcon className="h-3 w-3 mr-1" />
                {processingItems.has(item.id) ? 'Wait...' : 'Reject'}
              </button>
            </>
          )}

          {activeTab === 'available' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openRemoveModal(item);
                }}
                disabled={processingItems.has(item.id)}
                className="flex items-center justify-center px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded transition-colors duration-200 disabled:opacity-50 min-w-16"
              >
                <TrashIcon className="h-3 w-3 mr-1" />
                {processingItems.has(item.id) ? 'Wait...' : 'Remove'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openRejectFromApprovedModal(item);
                }}
                disabled={processingItems.has(item.id)}
                className="flex items-center justify-center px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors duration-200 disabled:opacity-50 min-w-16"
              >
                <XCircleIcon className="h-3 w-3 mr-1" />
                {processingItems.has(item.id) ? 'Wait...' : 'Reject'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Desktop/Tablet Layout (horizontal) */}
    <div className="hidden sm:flex items-center justify-between">
      {/* Left side - Item details */}
      <div className="flex items-center space-x-4 flex-1">
        {/* Image */}
        <div className="flex-shrink-0">
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <Image
              src={item.imageUrls[0]}
              alt={item.productName || 'Product'}
              width={60}
              height={60}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {item.productName || 'Unavailable'}
          </h3>
          <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
            <span className="truncate">
              <span className="font-medium">Seller:</span> {item.sellerName || 'Unavailable'}
            </span>
            <span className="truncate">
              <span className="font-medium">Category:</span> {item.category || 'Unavailable'}
            </span>
            <span className="flex-shrink-0">
              <span className="font-medium">Date:</span> {formatDate(item.postedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center space-x-2 ml-4">
        {/* Actions for pending items */}
        {activeTab === 'pending' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(item.id);
              }}
              disabled={processingItems.has(item.id)}
              className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              {processingItems.has(item.id) ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openRejectModal(item);
              }}
              disabled={processingItems.has(item.id)}
              className="flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <XCircleIcon className="h-3 w-3 mr-1" />
              {processingItems.has(item.id) ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        )}

        {/* Actions for available/approved items */}
        {activeTab === 'available' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openRemoveModal(item);
              }}
              disabled={processingItems.has(item.id)}
              className="flex items-center px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <TrashIcon className="h-3 w-3 mr-1" />
              {processingItems.has(item.id) ? 'Removing...' : 'Remove'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openRejectFromApprovedModal(item);
              }}
              disabled={processingItems.has(item.id)}
              className="flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <XCircleIcon className="h-3 w-3 mr-1" />
              {processingItems.has(item.id) ? 'Rejecting...' : 'Reject'}
            </button>
          </>
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

      {/* Search Bar and Filter */}
<div className="mb-6">
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div className="flex gap-4 items-center justify-center">
      {/* Search Input */}
      <div className="relative flex-2 max-w-md sm:max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 text-sm sm:text-base"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
          </button>
        )}
      </div>

      {/* Filter Button */}
      <button
        onClick={openFilterModal}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
          hasActiveFilters
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <FunnelIcon className="h-5 w-5 mr-2" />
        Filter
        {hasActiveFilters && (
          <span className="ml-2 bg-white text-green-600 text-xs px-2 py-1 rounded-full">
            Active
          </span>
        )}
      </button>

      {/* Clear All Filters Button */}
      {(hasActiveFilters || searchTerm) && (
        <button
          onClick={handleClearAllFilters}
          className="px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
        >
          Clear All
        </button>
      )}
    </div>

    {/* Search/Filter Results Info */}
    {(searchTerm || hasActiveFilters) && (
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-600">
          {activeTab === 'pending' 
            ? `Found ${filteredPendingItems.length} pending item${filteredPendingItems.length !== 1 ? 's' : ''}`
            : `Found ${filteredAvailableItems.length} approved item${filteredAvailableItems.length !== 1 ? 's' : ''}`
          }
          {searchTerm && ` matching "${searchTerm}"`}
          {hasActiveFilters && ` with applied filters`}
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
        onClick={() => setActiveTab('pending')}
        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
          activeTab === 'pending'
            ? 'border-green-500 text-green-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        Pending ({searchTerm ? filteredPendingItems.length : pendingItems.length})
      </button>
      <button
        onClick={() => setActiveTab('available')}
        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
          activeTab === 'available'
            ? 'border-green-500 text-green-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        Approved ({searchTerm ? filteredAvailableItems.length : availableItems.length})
      </button>
    </nav>
  </div>
</div>

       {/* Items Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="max-h-[600px] overflow-y-auto space-y-3">
            {activeTab === 'pending' ? (
              ((searchTerm || hasActiveFilters) ? filteredPendingItems : pendingItems).length > 0 ? (
                ((searchTerm || hasActiveFilters) ? filteredPendingItems : pendingItems).map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))
              ) : (
                <div className="text-center py-12">
                  {(searchTerm || hasActiveFilters) ? (
                    <>
                      <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No pending items found
                        {searchTerm && ` for "${searchTerm}"`}
                        {hasActiveFilters && !searchTerm && " with applied filters"}
                        {hasActiveFilters && searchTerm && " with current search and filters"}
                      </p>
                      <button
                        onClick={handleClearAllFilters}
                        className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
                      >
                        Clear search and filters
                      </button>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No pending items to review</p>
                    </>
                  )}
                </div>
              )
            ) : (
              ((searchTerm || hasActiveFilters) ? filteredAvailableItems : availableItems).length > 0 ? (
                ((searchTerm || hasActiveFilters) ? filteredAvailableItems : availableItems).map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))
              ) : (
                <div className="text-center py-12">
                  {(searchTerm || hasActiveFilters) ? (
                    <>
                      <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No approved items found
                        {searchTerm && ` for "${searchTerm}"`}
                        {hasActiveFilters && !searchTerm && " with applied filters"}
                        {hasActiveFilters && searchTerm && " with current search and filters"}
                      </p>
                      <button
                        onClick={handleClearAllFilters}
                        className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
                      >
                        Clear search and filters
                      </button>
                    </>
                  ) : (
                    <>
                      <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No available items</p>
                    </>
                  )}
                </div>
              )
            )}
          </div>
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
      {/* Filter Modal */}
<FilterModal
  isOpen={filterModalOpen}
  onClose={closeFilterModal}
  onApplyFilter={handleApplyFilter}
  currentFilters={appliedFilters}
/>
    </div>
  );
}