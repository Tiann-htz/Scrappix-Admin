import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import MarketplaceItemModal from '../components/MarketplaceItemModal';
import FilterModal from '../components/FilterModal';
import { logAdminActivity, ACTIVITY_TYPES, ACTIVITY_PAGES } from '../utils/AdminActivityLogger';
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
  ExclamationTriangleIcon,
MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function MarketplaceArchive() {
  const { user, adminData, loading: authLoading, signOut } = useAuth();  const [rejectedItems, setRejectedItems] = useState([]);
  const [removedItems, setRemovedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('rejected');
  const [isLoading, setIsLoading] = useState(true);
  const [processingItems, setProcessingItems] = useState(new Set());
  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
const [filteredRejectedItems, setFilteredRejectedItems] = useState([]);
const [filteredRemovedItems, setFilteredRemovedItems] = useState([]);
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
  if (!authLoading && !user) {
    router.push('/');
    return;
  }
  
  if (user && adminData) {
    fetchArchivedItems();
  }
}, [user, adminData, authLoading, router]);

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

  setFilteredRejectedItems(filterAndSearchItems(rejectedItems, searchTerm, appliedFilters));
  setFilteredRemovedItems(filterAndSearchItems(removedItems, searchTerm, appliedFilters));
}, [rejectedItems, removedItems, searchTerm, appliedFilters]);

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
    // Get item data before deleting for logging
    const itemDoc = await getDoc(doc(db, 'marketplaceItems', itemId));
    const itemData = itemDoc.data();

    await deleteDoc(doc(db, 'marketplaceItems', itemId));

    // Log admin activity
    if (itemData) {
      await logAdminActivity({
        activityType: ACTIVITY_TYPES.MARKETPLACE_ITEM_DELETED,
        page: ACTIVITY_PAGES.MARKETPLACE_ARCHIVE,
        details: {
          itemId: itemId,
          productName: itemData.productName,
          sellerId: itemData.sellerId,
          sellerName: itemData.sellerName,
          category: itemData.category,
          price: itemData.price,
          previousStatus: itemData.status
        },
        description: `Permanently deleted marketplace item: ${itemData.productName}`
      });
    }

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
    await signOut();
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
          {/* Status Badge for Mobile */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
            item.status === 'rejected' 
              ? 'bg-red-100 text-red-800'
              : item.status === 'removed'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
          </span>
        </div>
      </div>

      {/* Bottom row - Details and Actions */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col space-y-1 text-xs text-gray-600 flex-1 min-w-0">
          <span className="truncate">
            <span className="font-medium">Category:</span> {item.category || 'Unavailable'}
          </span>
          <span className="truncate">
            <span className="font-medium">Price:</span> ₱{item.price || 'Unavailable'}
          </span>
          <span className="truncate">
            <span className="font-medium">Date:</span> {formatDate(item.postedAt)}
          </span>
        </div>
        
        {/* Mobile Delete Action */}
        <div className="ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteItem(item.id, item.productName);
            }}
            disabled={processingItems.has(item.id)}
            className="flex items-center justify-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors duration-200 disabled:opacity-50 min-w-16"
          >
            <TrashIcon className="h-3 w-3 mr-1" />
            {processingItems.has(item.id) ? 'Wait...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Archive Details for Mobile */}
      <div className="mt-2">
        {item.status === 'rejected' && (
          <div className="p-2 bg-red-50 border border-red-200 rounded">
            <div className="flex items-start">
              <XCircleIcon className="h-3 w-3 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-800">Rejected:</p>
                <p className="text-xs text-red-700">{item.rejectedMessage || 'No reason provided'}</p>
              </div>
            </div>
          </div>
        )}

        {item.status === 'removed' && (
          <div className="p-2 bg-orange-50 border border-orange-200 rounded">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-3 w-3 text-orange-500 mr-1 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-orange-800">Removed:</p>
                <p className="text-xs text-orange-700">{item.removedMessage || 'No reason provided'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Desktop/Tablet Layout (horizontal) */}
    <div className="hidden sm:flex items-start justify-between">
      {/* Left side - Item details */}
      <div className="flex items-start space-x-4 flex-1">
        {/* Image */}
        <div className="flex-shrink-0">
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <Image
              src={item.imageUrls[0]}
              alt={item.productName || 'Product'}
              width={80}
              height={80}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {item.productName || 'Unavailable'}
            </h3>
            {/* Status Badge for Desktop */}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ml-3 ${
              item.status === 'rejected' 
                ? 'bg-red-100 text-red-800'
                : item.status === 'removed'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
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

          <div className="mb-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Seller:</span> {item.sellerName || 'Unavailable'}
            </p>
          </div>

          {/* Archive Details for Desktop */}
          {item.status === 'rejected' && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
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
            <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
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

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-start ml-4">
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
);

  if (authLoading || isLoading) {
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
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-700 text-sm sm:text-base"
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
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filter
              {hasActiveFilters && (
                <span className="ml-2 bg-white text-red-600 text-xs px-2 py-1 rounded-full">
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
                {activeTab === 'rejected' 
                  ? `Found ${filteredRejectedItems.length} rejected item${filteredRejectedItems.length !== 1 ? 's' : ''}`
                  : `Found ${filteredRemovedItems.length} removed item${filteredRemovedItems.length !== 1 ? 's' : ''}`
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
                onClick={() => setActiveTab('rejected')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rejected'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rejected ({(searchTerm || hasActiveFilters) ? filteredRejectedItems.length : rejectedItems.length})
              </button>
              <button
                onClick={() => setActiveTab('removed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'removed'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Removed ({(searchTerm || hasActiveFilters) ? filteredRemovedItems.length : removedItems.length})
              </button>
            </nav>
          </div>
        </div>

       {/* Items Grid */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div className="max-h-[600px] overflow-y-auto space-y-3">
          {activeTab === 'rejected' ? (
            ((searchTerm || hasActiveFilters) ? filteredRejectedItems : rejectedItems).length > 0 ? (
              ((searchTerm || hasActiveFilters) ? filteredRejectedItems : rejectedItems).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-12">
                {(searchTerm || hasActiveFilters) ? (
                  <>
                    <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No rejected items found
                      {searchTerm && ` for "${searchTerm}"`}
                      {hasActiveFilters && !searchTerm && " with applied filters"}
                      {hasActiveFilters && searchTerm && " with current search and filters"}
                    </p>
                    <button
                      onClick={handleClearAllFilters}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Clear search and filters
                    </button>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No rejected items in archive</p>
                  </>
                )}
              </div>
            )
          ) : (
            ((searchTerm || hasActiveFilters) ? filteredRemovedItems : removedItems).length > 0 ? (
              ((searchTerm || hasActiveFilters) ? filteredRemovedItems : removedItems).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-12">
                {(searchTerm || hasActiveFilters) ? (
                  <>
                    <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No removed items found
                      {searchTerm && ` for "${searchTerm}"`}
                      {hasActiveFilters && !searchTerm && " with applied filters"}
                      {hasActiveFilters && searchTerm && " with current search and filters"}
                    </p>
                    <button
                      onClick={handleClearAllFilters}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Clear search and filters
                    </button>
                  </>
                ) : (
                  <>
                    <ArchiveBoxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No removed items in archive</p>
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