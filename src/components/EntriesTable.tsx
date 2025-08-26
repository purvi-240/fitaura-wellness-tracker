"use client";
import { useState } from "react";
import { Entry } from "@/app/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EntriesTableProps {
  entries: Entry[];
  onChanged: (id: string) => Promise<void>;
  onEditEntry?: (entry: Entry) => void;
}

export default function EntriesTable({ entries, onChanged, onEditEntry }: EntriesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const del = async (id: string) => {
    setDeletingId(id);
    setError(null);
    
    try {
      await onChanged(id);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry. Please try again.';
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMoodEmoji = (mood: string) => {
    const emojis = {
      happy: '😊',
      neutral: '😐',
      tired: '😴',
      stressed: '😰'
    };
    return emojis[mood as keyof typeof emojis] || '😐';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entries</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-xs mt-1"
            >
              Dismiss
            </button>
          </div>
        )}
        
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Steps</th>
                <th className="px-3 py-2 text-left">Sleep (hrs)</th>
                <th className="px-3 py-2 text-left">Mood</th>
                <th className="px-3 py-2 text-left">Notes</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">
                    {formatDate(e.entry_date)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono">{e.steps.toLocaleString()}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono">{e.sleep_hours}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1">
                      <span>{getMoodEmoji(e.mood)}</span>
                      <span className="capitalize">{e.mood}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-[24ch] truncate" title={e.notes ?? "-"}>
                    {e.notes ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      {onEditEntry && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onEditEntry(e)}
                          disabled={deletingId === e.id}
                        >
                          Edit
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => del(e.id)}
                        disabled={deletingId === e.id}
                      >
                        {deletingId === e.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!entries.length && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>
                    No entries in this range. Add your first entry above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}