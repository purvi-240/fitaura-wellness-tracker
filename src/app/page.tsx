"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import CreateEntryModal from "@/components/CreateEntryModal";
import AnalyticsSection from "@/components/AnalyticsSection";
import RecentEntries from "@/components/RecentEntries";

import { useAuth } from "@/contexts/AuthContext";
import { DataService, EntryFormData } from "@/lib/dataService";



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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  // Data state
  const [allEntries, setAllEntries] = useState<Entry[]>([]); // For charts, stats, and recent entries
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);



    const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) {
        setAllEntries([]);
        return;
      }

      // Fetch all entries for charts, stats, and recent entries
      const allData = await DataService.fetchAllEntries(user.id, '1970-01-01', '2099-12-31');
      setAllEntries(allData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load entries. Please check your connection and try again.';
      setError(errorMessage);
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial data fetch when user is available
  useEffect(() => {
    if (!user || authLoading) return; // Don't fetch if no user or still loading auth
    
    // Clear cache to ensure fresh data on page load
    DataService.clearUserCache(user.id);
    fetchEntries();
  }, [user, authLoading, fetchEntries]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!user || authLoading) return;

    const subscription = DataService.subscribeToChanges(user.id, () => {
      // Refresh data when changes occur (but don't trigger other effects)
      setLoading(true);
      fetchEntries().finally(() => {
        setLoading(false);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, authLoading, fetchEntries]);

  // Calculate stats from all entries (for charts and summaries)
  const stats = useMemo(() => {
    const totalSteps = allEntries.reduce((s, e) => s + (e.steps || 0), 0);
    const avgSleep = allEntries.length ? (allEntries.reduce((s, e) => s + (e.sleep_hours || 0), 0) / allEntries.length) : 0;
    const moodCounts = { happy: 0, neutral: 0, tired: 0, stressed: 0 } as Record<Entry["mood"], number>;
    allEntries.forEach((e) => moodCounts[e.mood]++);
    return { totalSteps, avgSleep: Number(avgSleep.toFixed(2)), moodCounts };
  }, [allEntries]);

  const handleSaveEntry = async (entryData: EntryFormData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated. Please sign in to save entries.');
      }

      if (editingEntry) {
        // Update existing entry
        const updatedEntry = await DataService.updateEntry(editingEntry.id, entryData);
        // Optimistic update
        setAllEntries(prev => prev.map(entry => 
          entry.id === editingEntry.id ? updatedEntry : entry
        ));
        setEditingEntry(null); // Clear editing state
      } else {
        // Create new entry
        const newEntry = await DataService.createEntry(user.id, entryData);
        // Optimistic update
        setAllEntries(prev => [newEntry, ...prev]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save entry. Please try again.';
      setError(errorMessage);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await DataService.deleteEntry(id);
      // Optimistic update
      setAllEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry. Please try again.';
      setError(errorMessage);
    }
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fitaura Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user.email}
        </p>
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
      
      {/* Create Entry Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
          className="mb-6"
        >
          Create Entry
        </Button>
      </div>

      {/* Analytics Section with Time Range Filter */}
      <AnalyticsSection 
        entries={allEntries}
        totalSteps={stats.totalSteps}
        avgSleep={stats.avgSleep}
        moodCounts={stats.moodCounts}
      />
      
      {/* Recent Entries */}
      <RecentEntries 
        entries={allEntries}
        onEditEntry={handleEditEntry}
        onDeleteEntry={handleDeleteEntry}
        onViewAll={() => router.push('/entries')}
      />

      {/* Create Entry Modal */}
      <CreateEntryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaveEntry}
        editingEntry={editingEntry}
        userId={user?.id}
      />
    </div>
  );
}