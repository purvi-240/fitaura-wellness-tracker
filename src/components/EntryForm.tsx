"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntryFormData } from "@/lib/dataService";
import { Entry } from "@/app/page";

interface EntryFormProps {
  onSaved: (entry: EntryFormData) => Promise<void>;
  editingEntry?: Entry | null;
  onCancelEdit?: () => void;
}

export default function EntryForm({ onSaved, editingEntry, onCancelEdit }: EntryFormProps) {
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [steps, setSteps] = useState<number>(0);
  const [sleep, setSleep] = useState<number>(8);
  const [mood, setMood] = useState("happy");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load editing entry data when provided
  useEffect(() => {
    if (editingEntry) {
      setEntryDate(editingEntry.entry_date);
      setSteps(editingEntry.steps);
      setSleep(editingEntry.sleep_hours);
      setMood(editingEntry.mood);
      setNotes(editingEntry.notes || "");
    } else {
      // Reset form for new entry
      setEntryDate(new Date().toISOString().slice(0, 10));
      setSteps(0);
      setSleep(8);
      setMood("happy");
      setNotes("");
    }
    setError(null);
  }, [editingEntry]);

  const validateForm = (): string | null => {
    if (!entryDate) return "Date is required";
    if (steps < 0) return "Steps cannot be negative";
    if (sleep < 0 || sleep > 24) return "Sleep hours must be between 0 and 24";
    if (!mood) return "Mood is required";
    return null;
  };

  const save = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate form
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      const entryData: EntryFormData = {
        entry_date: entryDate,
        steps,
        sleep_hours: sleep,
        mood: mood as "happy" | "neutral" | "tired" | "stressed",
        notes: notes || null
      };
      
      await onSaved(entryData);
      
      // Reset form on successful save (only if not editing)
      if (!editingEntry) {
        setSteps(0);
        setSleep(8);
        setMood("happy");
        setNotes("");
      }
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save entry. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingEntry ? 'Edit Entry' : 'Add / Update Today'}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <div className="md:col-span-1">
          <label className="text-sm font-medium">Date</label>
          <Input 
            type="date" 
            value={entryDate} 
            onChange={(e) => setEntryDate(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-sm font-medium">Steps</label>
          <Input 
            type="number" 
            min={0} 
            value={steps} 
            onChange={(e) => setSteps(Number(e.target.value))}
            disabled={loading}
            placeholder="0"
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-sm font-medium">Sleep (hrs)</label>
          <Input 
            type="number" 
            min={0} 
            max={24} 
            step={0.25} 
            value={sleep} 
            onChange={(e) => setSleep(Number(e.target.value))}
            disabled={loading}
            placeholder="8"
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-sm font-medium">Mood</label>
          <Select value={mood} onValueChange={setMood} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Select mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="happy">😊 Happy</SelectItem>
              <SelectItem value="neutral">😐 Neutral</SelectItem>
              <SelectItem value="tired">😴 Tired</SelectItem>
              <SelectItem value="stressed">😰 Stressed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-5">
          <label className="text-sm font-medium">Notes</label>
          <Textarea 
            rows={2} 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            placeholder="Optional notes about your day..." 
          />
        </div>
        {error && (
          <div className="md:col-span-5">
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </p>
          </div>
        )}
        <div className="md:col-span-5 flex gap-2">
          <Button 
            onClick={save} 
            disabled={loading}
            className="flex-1 md:flex-none"
          >
            {loading ? "Saving…" : (editingEntry ? "Update Entry" : "Save Entry")}
          </Button>
          {editingEntry && onCancelEdit && (
            <Button 
              variant="outline" 
              onClick={onCancelEdit}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}