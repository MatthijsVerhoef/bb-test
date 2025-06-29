"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Search,
  MoreHorizontal,
  Calendar,
  DollarSign,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Edit,
  X,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: "ALL",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [statusCounts, setStatusCounts] = useState({});
  const [selectedRental, setSelectedRental] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionData, setActionData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch rentals
  const fetchRentals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });

      const response = await fetch(`/api/admin/rentals?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRentals(data.rentals);
        setPagination(data.pagination);
        setStatusCounts(data.statusCounts);
      }
    } catch (error) {
      console.error("Error fetching rentals:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== "") {
        fetchRentals();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Handle rental actions
  const handleAction = async (rental, action) => {
    setSelectedRental(rental);
    setActionType(action);
    setShowActionModal(true);
    setActionData({});
  };

  const submitAction = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/rentals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentalId: selectedRental.id,
          action: actionType,
          data: actionData,
        }),
      });

      if (response.ok) {
        fetchRentals();
        setShowActionModal(false);
        setSelectedRental(null);
        setActionData({});
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      PENDING: "text-yellow-700 bg-yellow-50",
      CONFIRMED: "text-blue-700 bg-blue-50",
      ACTIVE: "text-green-700 bg-green-50",
      COMPLETED: "text-gray-700 bg-gray-100",
      CANCELLED: "text-red-700 bg-red-50",
      LATE_RETURN: "text-orange-700 bg-orange-50",
      DISPUTED: "text-red-700 bg-red-50",
    };
    return colors[status] || "text-gray-700 bg-gray-100";
  };

  // Format status text
  const formatStatus = (status) => {
    return status
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Calculate rental duration
  const getRentalDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Status tabs
  const statusTabs = [
    { key: "ALL", label: "All rentals" },
    { key: "PENDING", label: "Pending" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "ACTIVE", label: "Active" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
    { key: "DISPUTED", label: "Disputed" },
  ];

  const activeFiltersCount = [
    filters.status !== "ALL",
    filters.search !== "",
    filters.sortBy !== "createdAt",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-semibold text-gray-900">Rentals</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange("status", tab.key)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      filters.status === tab.key
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  {tab.label}
                  {tab.key !== "ALL" && statusCounts[tab.key] > 0 && (
                    <span className="ml-2 text-gray-400">
                      {statusCounts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowUpDown className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-gray-900 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by renter, trailer, or ID..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="createdAt">Date created</option>
                <option value="startDate">Start date</option>
                <option value="endDate">End date</option>
                <option value="totalPrice">Price</option>
              </select>

              <button
                onClick={() =>
                  handleFilterChange(
                    "sortOrder",
                    filters.sortOrder === "asc" ? "desc" : "asc"
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {filters.sortOrder === "desc"
                  ? "↓ Newest first"
                  : "↑ Oldest first"}
              </button>

              <button
                onClick={() => {
                  setFilters({
                    status: "ALL",
                    search: "",
                    sortBy: "createdAt",
                    sortOrder: "desc",
                  });
                  setShowFilters(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-0 lg:px-0 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading rentals...</div>
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No rentals found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results count */}
            <div className="text-sm text-gray-600">
              {pagination.total} rentals found
            </div>

            {/* Rentals list */}
            <div className="bg-white">
              {rentals.map((rental, index) => (
                <div
                  key={rental.id}
                  className={`py-5 ${
                    index !== rentals.length - 1
                      ? "border-b border-gray-200"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left section */}
                    <div className="flex gap-4 flex-1">
                      {/* Trailer image */}
                      <div className="flex-shrink-0">
                        {rental.trailer.images?.[0] ? (
                          <img
                            src={rental.trailer.images[0].url}
                            alt={rental.trailer.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-lg" />
                        )}
                      </div>

                      {/* Rental details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-base font-medium text-gray-900 mb-1">
                              {rental.trailer.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {rental.trailer.type} •{" "}
                              {rental.trailer.licensePlate}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              rental.status
                            )}`}
                          >
                            {formatStatus(rental.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-gray-500">Renter</p>
                            <p className="font-medium text-gray-900">
                              {rental.renter.firstName} {rental.renter.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Duration</p>
                            <p className="font-medium text-gray-900">
                              {format(new Date(rental.startDate), "MMM d")} -{" "}
                              {format(new Date(rental.endDate), "MMM d")}
                              <span className="text-gray-500 font-normal">
                                {" "}
                                (
                                {getRentalDuration(
                                  rental.startDate,
                                  rental.endDate
                                )}{" "}
                                days)
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total</p>
                            <p className="font-medium text-gray-900">
                              €{rental.totalPrice.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Booking ID</p>
                            <p className="font-medium text-gray-900 font-mono">
                              #{rental.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative">
                      <button
                        onClick={() => handleAction(rental, "MENU")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Menu Modal */}
      {showActionModal && actionType === "MENU" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Rental actions
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActionType("VIEW");
                    window.open(`/rentals/${selectedRental.id}`, "_blank");
                    setShowActionModal(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  View details
                </button>
                <button
                  onClick={() => setActionType("UPDATE_STATUS")}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Update status
                </button>
                <button
                  onClick={() => setActionType("UPDATE_DATES")}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Change dates
                </button>
                <button
                  onClick={() => setActionType("UPDATE_PRICING")}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Adjust pricing
                </button>
                <button
                  onClick={() => setActionType("ADD_NOTE")}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Add note
                </button>
                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={() => {
                    if (
                      confirm("Are you sure you want to cancel this rental?")
                    ) {
                      // Handle cancellation
                      setShowActionModal(false);
                    }
                  }}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Cancel rental
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowActionModal(false)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showActionModal && actionType === "UPDATE_STATUS" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Update status
                </h2>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current status
                  </label>
                  <p className="text-sm text-gray-500">
                    {formatStatus(selectedRental?.status)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New status
                  </label>
                  <select
                    value={actionData.status || selectedRental?.status}
                    onChange={(e) =>
                      setActionData({ ...actionData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="LATE_RETURN">Late Return</option>
                    <option value="DISPUTED">Disputed</option>
                  </select>
                </div>

                {actionData.status === "CANCELLED" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for cancellation
                    </label>
                    <textarea
                      value={actionData.cancellationReason || ""}
                      onChange={(e) =>
                        setActionData({
                          ...actionData,
                          cancellationReason: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                      placeholder="Please provide a reason..."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Dates Modal */}
      {showActionModal && actionType === "UPDATE_DATES" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Change dates
                </h2>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start date
                  </label>
                  <input
                    type="datetime-local"
                    defaultValue={
                      selectedRental &&
                      format(
                        new Date(selectedRental.startDate),
                        "yyyy-MM-dd'T'HH:mm"
                      )
                    }
                    onChange={(e) =>
                      setActionData({
                        ...actionData,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End date
                  </label>
                  <input
                    type="datetime-local"
                    defaultValue={
                      selectedRental &&
                      format(
                        new Date(selectedRental.endDate),
                        "yyyy-MM-dd'T'HH:mm"
                      )
                    }
                    onChange={(e) =>
                      setActionData({ ...actionData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update dates"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Pricing Modal */}
      {showActionModal && actionType === "UPDATE_PRICING" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Adjust pricing
                </h2>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total price (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedRental?.totalPrice}
                    onChange={(e) =>
                      setActionData({
                        ...actionData,
                        totalPrice: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service fee (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedRental?.serviceFee || 0}
                    onChange={(e) =>
                      setActionData({
                        ...actionData,
                        serviceFee: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security deposit (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedRental?.securityDeposit || 0}
                    onChange={(e) =>
                      setActionData({
                        ...actionData,
                        securityDeposit: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update pricing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showActionModal && actionType === "ADD_NOTE" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add note
                </h2>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={actionData.note || ""}
                  onChange={(e) =>
                    setActionData({ ...actionData, note: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  placeholder="Add your note here..."
                />
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
