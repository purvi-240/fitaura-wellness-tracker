"use client";
import { useState } from "react";
import { Entry } from "@/app/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


interface RecentEntriesProps {
  entries: Entry[];
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (id: string) => Promise<void>;
  onViewAll: () => void;
}

export default function RecentEntries({ entries, onEditEntry, onDeleteEntry, onViewAll }: RecentEntriesProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Get top 5 most recent entries by creation date
  const recentEntries = entries
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteEntry(id);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Recent Entries</CardTitle>
        <Button 
          onClick={onViewAll}
          variant="outline"
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          View All Entries
        </Button>
      </CardHeader>
      <CardContent>
        {recentEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No entries yet. Create your first entry to get started!</p>
          </div>
        ) : (
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
                {recentEntries.map((entry) => (
                  <tr key={entry.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">
                      {formatDate(entry.entry_date)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono">{entry.steps.toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono">{entry.sleep_hours}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1">
                        <span>{getMoodEmoji(entry.mood)}</span>
                        <span className="capitalize">{entry.mood}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[24ch] truncate" title={entry.notes ?? "-"}>
                      {entry.notes ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onEditEntry(entry)}
                          disabled={deletingId === entry.id}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                        >
                          {deletingId === entry.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 