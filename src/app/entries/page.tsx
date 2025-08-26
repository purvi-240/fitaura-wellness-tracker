"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DateRangePicker from "@/components/DateRangePicker";
import SearchAndFilter, { FilterOptions } from "@/components/SearchAndFilter";
import EntriesTable from "@/components/EntriesTable";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import { DataService, FetchResult } from "@/lib/dataService";

export type Entry = {
  id: string;
  user_id: string;
  entry_date: string; // ISO date
  steps: number;
  sleep_hours: number;
  mood: "happy" | "neutral" | "tired" | "stressed";
  notes: string | null;
  created_at: string;
  updated_at?: string;
};

export default function AllEntriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Date range state
  const [from, setFrom] = useState<string>(() => new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Filter state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    search: "",
    searchType: 'all',
    moodFilter: "all",
    sortBy: 'entry_date',
    sortOrder: 'desc'
  });
  
  // Data state
  const [entries, setEntries] = useState<Entry[]>([]);
  const [fetchResult, setFetchResult] = useState<FetchResult>({
    data: [],
    total: 0,
    page: 1,
    limit: 25,
    hasMore: false
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to store current filter values to avoid dependency issues
  const filterOptionsRef = useRef(filterOptions);
  filterOptionsRef.current = filterOptions;

  const fetchEntries = useCallback(async (page: number = currentPage, limit: number = itemsPerPage) => {
    setLoading(true);
    setError(null);
    
    // If this is a refresh (page 1), update the current page state
    if (page === 1) {
      setCurrentPage(1);
    }

    try {
      if (!user) {
        setEntries([]);
        setFetchResult({
          data: [],
          total: 0,
          page: 1,
          limit: 25,
          hasMore: false
        });
        return;
      }

      // Fetch from real database with pagination and filters
      const result = await DataService.fetchEntries(user.id, from, to, {
        page,
        limit,
        search: filterOptionsRef.current.search,
        searchType: filterOptionsRef.current.searchType,
        moodFilter: filterOptionsRef.current.moodFilter,
        sortBy: filterOptionsRef.current.sortBy,
        sortOrder: filterOptionsRef.current.sortOrder
      });
      
      setFetchResult(result);
      setEntries(result.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load entries. Please check your connection and try again.';
      setError(errorMessage);
      setEntries([]);
      setFetchResult({
        data: [],
        total: 0,
        page: 1,
        limit: 25,
        hasMore: false
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, from, to, user]);

  // Initial data fetch when user is available
  useEffect(() => {
    if (!user || authLoading) return;
    
    setCurrentPage(1);
    fetchEntries(1, itemsPerPage);
  }, [user, authLoading, fetchEntries, itemsPerPage]);

  // Fetch entries when date range or filters change
  useEffect(() => {
    if (!user || authLoading) return;
    
    setCurrentPage(1);
    fetchEntries(1, itemsPerPage);
  }, [from, to, filterOptions.search, filterOptions.searchType, filterOptions.moodFilter, filterOptions.sortBy, filterOptions.sortOrder, fetchEntries, itemsPerPage, user, authLoading]);

  // Handle pagination changes
  useEffect(() => {
    if (!user || authLoading) return;
    
    if (currentPage > 1) {
      fetchEntries(currentPage, itemsPerPage);
    }
  }, [currentPage, itemsPerPage, user, fetchEntries, authLoading]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!user || authLoading) return;

    const subscription = DataService.subscribeToChanges(user.id, () => {
      // Refresh data when changes occur
      setLoading(true);
      fetchEntries(currentPage, itemsPerPage).finally(() => {
        setLoading(false);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, authLoading, currentPage, itemsPerPage, fetchEntries]);



  const handleDeleteEntry = async (id: string) => {
    try {
      await DataService.deleteEntry(id);
      // Optimistic update
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry. Please try again.';
      setError(errorMessage);
    }
  };



  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilterOptions(newFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };



  // Redirect to signin if no user session
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Entries</h1>
            <p className="text-gray-600">Manage and view all your wellness entries</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Date Range and Actions */}
      <div className="flex justify-between items-center">
        <DateRangePicker 
          from={from} 
          to={to} 
          onChange={(f, t) => { setFrom(f); setTo(t); }} 
          loading={loading} 
        />
      </div>
      
      {/* Search and Filter */}
      <SearchAndFilter 
        onFilterChange={handleFilterChange}
        loading={loading}
      />
      
      {/* Entries Table */}
      <EntriesTable 
        entries={entries} 
        onChanged={handleDeleteEntry}
      />
      
      {/* Pagination */}
      <Pagination
        currentPage={fetchResult.page}
        totalPages={Math.ceil(fetchResult.total / fetchResult.limit)}
        totalItems={fetchResult.total}
        itemsPerPage={fetchResult.limit}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />

    </div>
  );
} 