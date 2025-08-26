import { supabase } from './supabase';
import { Entry } from '@/app/page';

export type EntryFormData = Omit<Entry, 'id' | 'user_id' | 'created_at'>;

export interface FetchOptions {
  page?: number;
  limit?: number;
  search?: string;
  searchType?: 'all' | 'notes' | 'date' | 'steps' | 'sleep';
  moodFilter?: string;
  sortBy?: 'entry_date' | 'steps' | 'sleep_hours' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface FetchResult {
  data: Entry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Stats {
  totalSteps: number;
  avgSleep: number;
  moodCounts: Record<string, number>;
  totalEntries: number;
}

// Simple in-memory cache
class Cache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new Cache();

export class DataService {
  static async fetchEntries(
    userId: string, 
    fromDate: string, 
    toDate: string,
    options: FetchOptions = {}
  ): Promise<FetchResult> {
    const { page = 1, limit = 50, search, searchType = 'all', moodFilter, sortBy = 'entry_date', sortOrder = 'desc' } = options;
    
    // Create cache key
    const cacheKey = `entries:${userId}:${fromDate}:${toDate}:${JSON.stringify(options)}`;
    const cached = cache.get<FetchResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let query = supabase
        .from('wellness_entries')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('entry_date', fromDate)
        .lte('entry_date', toDate);

      // Apply search filter based on search type
      if (search) {
        switch (searchType) {
          case 'notes':
            query = query.ilike('notes', `%${search}%`);
            break;
          case 'date':
            query = query.ilike('entry_date', `%${search}%`);
            break;
          case 'steps':
            // For numeric search, try to match exact or range
            const stepsValue = parseInt(search);
            if (!isNaN(stepsValue)) {
              query = query.eq('steps', stepsValue);
            } else {
              // If not a number, search in notes for step-related text
              query = query.ilike('notes', `%${search}%`);
            }
            break;
          case 'sleep':
            // For numeric search, try to match exact or range
            const sleepValue = parseFloat(search);
            if (!isNaN(sleepValue)) {
              query = query.eq('sleep_hours', sleepValue);
            } else {
              // If not a number, search in notes for sleep-related text
              query = query.ilike('notes', `%${search}%`);
            }
            break;
          case 'all':
          default:
            // Search in all text fields
            query = query.or(`notes.ilike.%${search}%,entry_date.ilike.%${search}%`);
            break;
        }
      }

      // Apply mood filter
      if (moodFilter && moodFilter !== 'all') {
        query = query.eq('mood', moodFilter);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch entries: ${error.message}`);
      }

      const result: FetchResult = {
        data: data || [],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };

      // Cache the result for 2 minutes
      cache.set(cacheKey, result, 2 * 60 * 1000);

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async fetchAllEntries(userId: string, fromDate: string, toDate: string): Promise<Entry[]> {
    // For charts and summaries, we need all data without pagination
    const cacheKey = `all-entries:${userId}:${fromDate}:${toDate}`;
    const cached = cache.get<Entry[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('wellness_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('entry_date', fromDate)
        .lte('entry_date', toDate)
        .order('entry_date', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch entries: ${error.message}`);
      }

      const result = data || [];
      
      // Cache the result for 1 minute (shorter TTL for all data)
      cache.set(cacheKey, result, 60 * 1000);

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async createEntry(userId: string, entryData: EntryFormData): Promise<Entry> {
    try {
      const { data, error } = await supabase
        .from('wellness_entries')
        .insert([
          {
            user_id: userId,
            entry_date: entryData.entry_date,
            steps: entryData.steps,
            sleep_hours: entryData.sleep_hours,
            mood: entryData.mood,
            notes: entryData.notes
          }
        ])
        .select()
        .single();

      if (error) {
        // Handle specific error cases with user-friendly messages
        if (error.code === '23505' && error.message.includes('wellness_entries_user_id_entry_date_key')) {
          throw new Error('Duplicate entries not allowed. An entry for this date already exists.');
        }
        
        if (error.code === '23503') {
          throw new Error('Invalid user. Please sign in again.');
        }
        
        throw new Error(`Failed to create entry: ${error.message}`);
      }

      // Invalidate related caches
      cache.invalidate(`entries:${userId}`);
      cache.invalidate(`all-entries:${userId}`);

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async updateEntry(entryId: string, entryData: Partial<EntryFormData>): Promise<Entry> {
    try {
      const { data, error } = await supabase
        .from('wellness_entries')
        .update({
          ...entryData,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        
        // Handle specific error cases with user-friendly messages
        if (error.code === '23505' && error.message.includes('wellness_entries_user_id_entry_date_key')) {
          throw new Error('Duplicate entries not allowed. An entry for this date already exists.');
        }
        
        if (error.code === '23503') {
          throw new Error('Invalid user. Please sign in again.');
        }
        
        // Generic error message
        throw new Error('Failed to update entry. Please try again.');
      }

      // Invalidate related caches
      cache.invalidate(`entries:${data.user_id}`);
      cache.invalidate(`all-entries:${data.user_id}`);

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteEntry(entryId: string): Promise<void> {
    try {
      // Get the entry first to know the user_id for cache invalidation
      const entry = await this.getEntryById(entryId);
      
      const { error } = await supabase
        .from('wellness_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        throw new Error(`Failed to delete entry: ${error.message}`);
      }

      // Invalidate related caches
      if (entry) {
        cache.invalidate(`entries:${entry.user_id}`);
        cache.invalidate(`all-entries:${entry.user_id}`);
      }
    } catch (error) {
      throw error;
    }
  }

  static async getEntryById(entryId: string): Promise<Entry | null> {
    const cacheKey = `entry:${entryId}`;
    const cached = cache.get<Entry>(cacheKey);
    if (cached && Object.keys(cached).length > 0) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('wellness_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Entry not found
        }
        throw new Error(`Failed to fetch entry: ${error.message}`);
      }

      // Cache individual entry for 5 minutes
      cache.set(cacheKey, data, 5 * 60 * 1000);

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getEntryByDate(userId: string, date: string): Promise<Entry | null> {
    const cacheKey = `entry-by-date:${userId}:${date}`;
    const cached = cache.get<Entry>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('wellness_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_date', date)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Entry not found
        }
        throw new Error(`Failed to fetch entry: ${error.message}`);
      }

      // Cache for 2 minutes
      cache.set(cacheKey, data, 2 * 60 * 1000);

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async checkEntryExists(userId: string, date: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('wellness_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('entry_date', date);

      // Exclude current entry when updating
      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to check entry existence.');
      }

      const exists = data && data.length > 0;
      return exists;
    } catch (error) {
      throw error;
    }
  }

  static async searchEntries(userId: string, query: string): Promise<Entry[]> {
    const cacheKey = `search:${userId}:${query}`;
    const cached = cache.get<Entry[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('wellness_entries')
        .select('*')
        .eq('user_id', userId)
        .or(`notes.ilike.%${query}%,entry_date.ilike.%${query}%`)
        .order('entry_date', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`Failed to search entries: ${error.message}`);
      }

      const result = data || [];
      
      // Cache search results for 1 minute
      cache.set(cacheKey, result, 60 * 1000);

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getStats(userId: string, fromDate: string, toDate: string): Promise<Stats> {
    const cacheKey = `stats:${userId}:${fromDate}:${toDate}`;
    const cached = cache.get<Stats>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('wellness_entries')
        .select('steps, sleep_hours, mood')
        .eq('user_id', userId)
        .gte('entry_date', fromDate)
        .lte('entry_date', toDate);

      if (error) {
        throw new Error(`Failed to fetch stats: ${error.message}`);
      }

      const entries = data || [];
      const stats = {
        totalSteps: entries.reduce((sum, e) => sum + (e.steps || 0), 0),
        avgSleep: entries.length ? (entries.reduce((sum, e) => sum + (e.sleep_hours || 0), 0) / entries.length) : 0,
        moodCounts: entries.reduce((counts, e) => {
          counts[e.mood] = (counts[e.mood] || 0) + 1;
          return counts;
        }, {} as Record<string, number>),
        totalEntries: entries.length
      };

      // Cache stats for 3 minutes
      cache.set(cacheKey, stats, 3 * 60 * 1000);

      return stats;
    } catch (error) {
      throw error;
    }
  }

  static subscribeToChanges(userId: string, callback: (payload: unknown) => void) {
    return supabase
      .channel('wellness_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wellness_entries',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Invalidate caches when data changes
          cache.invalidate(`entries:${userId}`);
          cache.invalidate(`all-entries:${userId}`);
          cache.invalidate(`stats:${userId}`);
          
          // Call the original callback
          callback(payload);
        }
      )
      .subscribe();
  }

  // Utility method to clear all caches
  static clearCache() {
    cache.clear();
  }

  static clearUserCache(userId: string) {
    cache.invalidate(`:${userId}:`);
  }
} 