import React, { useState, useEffect, useMemo } from 'react';
import { FiEye, FiCheck, FiX, FiChevronUp, FiChevronDown, FiStar } from 'react-icons/fi';
import api from '../../utils/api';

const Review = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Table controls
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await api('/api/reviews/all');
      setReviews(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewStatus = async (reviewId, status) => {
    try {
      await api(`/api/reviews/${reviewId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      // Update local state
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, status }
          : review
      ));
    } catch (err) {
      alert('Error updating review status: ' + err.message);
    }
  };

  const openReviewModal = (review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReview(null);
  };

  // Data processing
  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    if (statusFilter) {
      filtered = filtered.filter(review => review.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(review =>
        Object.values(review).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered;
  }, [reviews, statusFilter, searchTerm]);

  const sortedReviews = useMemo(() => {
    let sortable = [...filteredReviews];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortable;
  }, [filteredReviews, sortConfig]);

  const paginatedReviews = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return sortedReviews.slice(firstPageIndex, lastPageIndex);
  }, [sortedReviews, currentPage, itemsPerPage]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ children, sortKey }) => (
    <th className="py-3 px-4 text-left font-semibold cursor-pointer" onClick={() => handleSort(sortKey)}>
      <div className="flex items-center">
        {children}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'ascending' ? 
            <FiChevronUp className="ml-1" /> : 
            <FiChevronDown className="ml-1" />
        ) : null}
      </div>
    </th>
  );

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const totalPages = Math.ceil(sortedReviews.length / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(startEntry + itemsPerPage - 1, sortedReviews.length);

  if (loading) return <div className="text-center py-8">Loading reviews...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">All Reviews</h2>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <span>Show</span>
          <select 
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="search" className="text-gray-600">Search:</label>
          <input 
            id="search"
            type="text" 
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-[#e0c58a] text-gray-700">
            <tr>
              <SortableHeader sortKey="id">ID</SortableHeader>
              <SortableHeader sortKey="reviewer_name">Reviewer</SortableHeader>
              <SortableHeader sortKey="company_name">Company</SortableHeader>
              <SortableHeader sortKey="rating">Rating</SortableHeader>
              <SortableHeader sortKey="status">Status</SortableHeader>
              <SortableHeader sortKey="created_at">Date</SortableHeader>
              <th className="py-3 px-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {paginatedReviews.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">No reviews found</td>
              </tr>
            ) : (
              paginatedReviews.map((review) => (
                <tr key={review.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{review.id}</td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{review.reviewer_name}</div>
                      <div className="text-sm text-gray-500">{review.reviewer_email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{review.company_name}</div>
                      <div className="text-sm text-gray-500">{review.company_email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{renderStars(review.rating)}</td>
                  <td className="py-3 px-4">{getStatusBadge(review.status)}</td>
                  <td className="py-3 px-4">
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {review.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleReviewStatus(review.id, 'approved')}
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md transition duration-300"
                            title="Approve Review"
                          >
                            <FiCheck />
                          </button>
                          <button 
                            onClick={() => handleReviewStatus(review.id, 'rejected')}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md transition duration-300"
                            title="Reject Review"
                          >
                            <FiX />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => openReviewModal(review)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition duration-300"
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-gray-600">
          Showing {sortedReviews.length > 0 ? startEntry : 0} to {endEntry} of {sortedReviews.length} entries
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 border-t border-b bg-[#e0c58a] text-gray-800 font-bold">
            {currentPage}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Review Details Modal */}
      {isModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Review Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reviewer</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedReview.reviewer_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedReview.company_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Overall Rating</label>
                  <div className="mt-1">{renderStars(selectedReview.rating)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedReview.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reliability</label>
                  <div className="mt-1">{renderStars(selectedReview.reliability)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Communication</label>
                  <div className="mt-1">{renderStars(selectedReview.communication)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timeliness</label>
                  <div className="mt-1">{renderStars(selectedReview.timeliness)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Overall Experience</label>
                  <div className="mt-1">{renderStars(selectedReview.overall_experience)}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Review Text</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-900">
                  {selectedReview.review_text}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Submitted</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedReview.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              {selectedReview.status === 'pending' && (
                <>
                  <button 
                    onClick={() => {
                      handleReviewStatus(selectedReview.id, 'rejected');
                      closeModal();
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => {
                      handleReviewStatus(selectedReview.id, 'approved');
                      closeModal();
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Approve
                  </button>
                </>
              )}
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Review;