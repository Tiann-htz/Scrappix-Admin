import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import UserItem from '../components/UserItem';
import UserDetailsModal from '../components/UserDetailsModal';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ShieldCheckIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function UserManagement() {
  const { user, adminData, loading: authLoading, signOut } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    
    if (user && adminData) {
      fetchUsers();
    }
  }, [user, adminData, authLoading, router]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // Get all chat reports
      const chatReportsSnapshot = await getDocs(collection(db, 'chatReports'));
      
      // Get all chat removals
      const chatRemovalsSnapshot = await getDocs(collection(db, 'chatRemovals'));
      
      // Get all marketplace items
      const marketplaceSnapshot = await getDocs(collection(db, 'marketplaceItems'));
      
      // Get all product transactions
      const transactionsSnapshot = await getDocs(collection(db, 'productTransactions'));

      // Process users data
      const usersData = await Promise.all(
        usersSnapshot.docs.map(async (userDoc) => {
          const userData = {
            id: userDoc.id,
            ...userDoc.data()
          };

          // Count approved reports for this user (where they were reported)
          const approvedReports = chatReportsSnapshot.docs.filter(reportDoc => {
            const reportData = reportDoc.data();
            return reportData.reportedPersonId === userData.id && reportData.status === 'approved';
          }).length;

          // Count chat removals for this user
          const chatRemovals = chatRemovalsSnapshot.docs.filter(removalDoc => {
            const removalData = removalDoc.data();
            return removalData.removedPersonId === userData.id || removalData.removedByUserId === userData.id;
          }).length;

          // Count marketplace items posted by this user
          const postedItems = marketplaceSnapshot.docs.filter(itemDoc => {
            const itemData = itemDoc.data();
            return itemData.sellerId === userData.id;
          }).length;

          // Count sold items by this user
          const soldItems = transactionsSnapshot.docs.filter(transactionDoc => {
            const transactionData = transactionDoc.data();
            return transactionData.sellerId === userData.id && transactionData.status === 'completed';
          }).length;

          return {
            ...userData,
            approvedReports,
            chatRemovals,
            postedItems,
            soldItems
          };
        })
      );

      // Sort users by risk level (approved reports desc, then chat removals desc)
      usersData.sort((a, b) => {
        if (a.approvedReports !== b.approvedReports) {
          return b.approvedReports - a.approvedReports;
        }
        return b.chatRemovals - a.chatRemovals;
      });

      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users data');
    } finally {
      setIsLoading(false);
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

  // Search functionality
  const filterUsers = (query) => {
    const lowercaseQuery = query.toLowerCase().trim();
    
    if (!lowercaseQuery) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.fullName?.toLowerCase().includes(lowercaseQuery) ||
      user.email?.toLowerCase().includes(lowercaseQuery) ||
      user.nickname?.toLowerCase().includes(lowercaseQuery)
    );

    setFilteredUsers(filtered);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterUsers(query);
  };

  // Modal handlers
  const handleViewDetails = (userData) => {
    setSelectedUser(userData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  // Action handlers (placeholder functions - no actual functionality yet)
  const handleSuspendUser = (userData) => {
    console.log('Suspend user:', userData);
    toast.error('Suspend user functionality not implemented yet');
  };

  const handleReinstateUser = (userData) => {
    console.log('Reinstate user:', userData);
    toast.error('Reinstate user functionality not implemented yet');
  };

  const handleBanUser = (userData) => {
    console.log('Ban user:', userData);
    toast.error('Ban user functionality not implemented yet');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
              <ShieldCheckIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-blue-800">User Management</h1>
                <p className="text-sm text-gray-600">Monitor user behavior and manage accounts</p>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                  placeholder="Search users by name, email, or nickname..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-sm sm:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      filterUsers('');
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  </button>
                )}
              </div>

              {/* Clear Search Button */}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    filterUsers('');
                  }}
                  className="px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Search Results Info */}
            {searchQuery && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600">
                  Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Users ({searchQuery ? filteredUsers.length : users.length})</h2>
            <p className="text-sm text-gray-600 mt-1">Monitor user behavior and manage account status</p>
          </div>
          <div className="p-6">
            {(searchQuery ? filteredUsers.length === 0 : users.length === 0) ? (
              <div className="text-center py-8">
                {searchQuery ? (
                  <>
                    <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users match your search</p>
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search terms</p>
                  </>
                ) : (
                  <>
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                    <p className="text-sm text-gray-400 mt-2">Users will appear here</p>
                  </>
                )}
              </div>
            ) : (
              <div className="max-h-[550px] overflow-y-auto space-y-4">
                {(searchQuery ? filteredUsers : users).map((userData) => (
                  <UserItem
                    key={userData.id}
                    userData={userData}
                    onViewDetails={handleViewDetails}
                    onSuspendUser={handleSuspendUser}
                    onReinstateUser={handleReinstateUser}
                    onBanUser={handleBanUser}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* User Details Modal */}
      <UserDetailsModal 
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}