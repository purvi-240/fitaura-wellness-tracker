"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, SortAsc, SortDesc, X } from "lucide-react";

export interface FilterOptions {
  search: string;
  searchType: 'all' | 'notes' | 'date' | 'steps' | 'sleep';
  moodFilter: string;
  sortBy: 'entry_date' | 'steps' | 'sleep_hours' | 'created_at';
  sortOrder: 'asc' | 'desc';
}

interface SearchAndFilterProps {
  onFilterChange: (options: FilterOptions) => void;
  loading?: boolean;
}

export default function SearchAndFilter({ onFilterChange, loading = false }: SearchAndFilterProps) {
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<'all' | 'notes' | 'date' | 'steps' | 'sleep'>('all');
  const [moodFilter, setMoodFilter] = useState("all");
  const [sortBy, setSortBy] = useState<'entry_date' | 'steps' | 'sleep_hours' | 'created_at'>('entry_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        search,
        searchType,
        moodFilter,
        sortBy,
        sortOrder
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchType, moodFilter, sortBy, sortOrder, onFilterChange]);

  const clearFilters = () => {
    setSearch("");
    setSearchType('all');
    setMoodFilter("all");
    setSortBy('entry_date');
    setSortOrder('desc');
  };

  const hasActiveFilters = search || searchType !== 'all' || moodFilter !== 'all' || sortBy !== 'entry_date' || sortOrder !== 'desc';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              {/* Search Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Search in</label>
                <Select value={searchType} onValueChange={(value: 'all' | 'notes' | 'date' | 'steps' | 'sleep') => setSearchType(value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="steps">Steps</SelectItem>
                    <SelectItem value="sleep">Sleep</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mood Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Mood</label>
                <Select value={moodFilter} onValueChange={setMoodFilter} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="All moods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All moods</SelectItem>
                    <SelectItem value="happy">😊 Happy</SelectItem>
                    <SelectItem value="neutral">😐 Neutral</SelectItem>
                    <SelectItem value="tired">😴 Tired</SelectItem>
                    <SelectItem value="stressed">😰 Stressed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <Select value={sortBy} onValueChange={(value: 'entry_date' | 'steps' | 'sleep_hours' | 'created_at') => setSortBy(value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry_date">Date</SelectItem>
                    <SelectItem value="steps">Steps</SelectItem>
                    <SelectItem value="sleep_hours">Sleep</SelectItem>
                    <SelectItem value="created_at">Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-sm font-medium mb-2 block">Order</label>
                <div className="flex gap-2">
                  <Button
                    variant={sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortOrder('desc')}
                    disabled={loading}
                    className="flex-1"
                  >
                    <SortDesc className="h-4 w-4 mr-1" />
                    Desc
                  </Button>
                  <Button
                    variant={sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortOrder('asc')}
                    disabled={loading}
                    className="flex-1"
                  >
                    <SortAsc className="h-4 w-4 mr-1" />
                    Asc
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 text-sm">
              {search && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Search: &quot;{search}&quot; in {searchType}
                </span>
              )}
              {searchType !== 'all' && !search && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Search type: {searchType}
                </span>
              )}
              {moodFilter !== 'all' && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Mood: {moodFilter}
                </span>
              )}
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                Sort: {sortBy} ({sortOrder})
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 