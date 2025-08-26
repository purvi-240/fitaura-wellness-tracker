"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntryFormData, DataService } from "@/lib/dataService";
import { Entry } from "@/app/page";
import { X } from "lucide-react";

interface CreateEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (entry: EntryFormData) => Promise<void>;
  editingEntry?: Entry | null;
  userId?: string;
}

export default function CreateEntryModal({ isOpen, onClose, onSaved, editingEntry, userId }: CreateEntryModalProps) {
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [steps, setSteps] = useState<number>(0);
  const [sleep, setSleep] = useState<number>(0);
  const [mood, setMood] = useState("happy");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepsFocused, setStepsFocused] = useState(false);
  const [sleepFocused, setSleepFocused] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<{
    steps?: string;
    sleep?: string;
  }>({});

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
      setSleep(0);
      setMood("happy");
      setNotes("");
      setStepsFocused(false);
      setSleepFocused(false);
    }
    setError(null);
    setValidationWarnings({});
  }, [editingEntry, isOpen]);

  const validateForm = (): string | null => {
    if (!entryDate) return "Date is required";
    if (steps < 0) return "Steps cannot be negative";
    if (steps > 999999) return "Steps cannot exceed 999,999";
    if (sleep < 0 || sleep > 24) return "Sleep hours must be between 0 and 24";
    if (!mood) return "Mood is required";
    return null;
  };

  const validateField = (field: 'steps' | 'sleep', value: number) => {
    const warnings = { ...validationWarnings };
    
    if (field === 'steps') {
      if (value > 999999) {
        warnings.steps = "Steps cannot exceed 999,999";
      } else if (value < 0) {
        warnings.steps = "Steps cannot be negative";
      } else {
        delete warnings.steps;
      }
    }
    
    if (field === 'sleep') {
      if (value > 24) {
        warnings.sleep = "Sleep hours cannot exceed 24 hours";
      } else if (value < 0) {
        warnings.sleep = "Sleep hours cannot be negative";
      } else {
        delete warnings.sleep;
      }
    }
    
    setValidationWarnings(warnings);
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

      // Check for duplicate entry if creating new entry
      if (!editingEntry && userId) {
        const exists = await DataService.checkEntryExists(userId, entryDate);
        if (exists) {
          setError('Duplicate entries not allowed. An entry for this date already exists.');
          return;
        }
      }

      // Check for duplicate entry if updating (different date)
      if (editingEntry && userId && editingEntry.entry_date !== entryDate) {
        const exists = await DataService.checkEntryExists(userId, entryDate, editingEntry.id);
        if (exists) {
          setError('Duplicate entries not allowed. An entry for this date already exists.');
          return;
        }
      }

      const entryData: EntryFormData = {
        entry_date: entryDate,
        steps,
        sleep_hours: sleep,
        mood: mood as "happy" | "neutral" | "tired" | "stressed",
        notes: notes || null
      };
      
      await onSaved(entryData);
      
      // Close modal on successful save
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {editingEntry ? 'Edit Entry' : 'Create Entry'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Date</label>
            <Input 
              type="date" 
              value={entryDate} 
              onChange={(e) => setEntryDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Steps</label>
            <Input 
              type="number" 
              min={0} 
              max={999999}
              value={stepsFocused && steps === 0 ? "" : steps} 
              onChange={(e) => {
                const value = Number(e.target.value) || 0;
                setSteps(value);
                validateField('steps', value);
              }}
              onFocus={() => setStepsFocused(true)}
              onBlur={() => {
                setStepsFocused(false);
                if (steps === 0) setSteps(0);
              }}
              disabled={loading}
              placeholder="0"
            />
            {validationWarnings.steps && (
              <p className="text-red-600 text-sm mt-1">{validationWarnings.steps}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Sleep (hrs)</label>
            <Input 
              type="number" 
              min={0} 
              max={24} 
              step={0.25} 
              value={sleepFocused && sleep === 0 ? "" : sleep} 
              onChange={(e) => {
                const value = Number(e.target.value) || 0;
                setSleep(value);
                validateField('sleep', value);
              }}
              onFocus={() => setSleepFocused(true)}
              onBlur={() => {
                setSleepFocused(false);
                if (sleep === 0) setSleep(0);
              }}
              disabled={loading}
              placeholder="0"
            />
            {validationWarnings.sleep && (
              <p className="text-red-600 text-sm mt-1">{validationWarnings.sleep}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Mood</label>
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

          <div>
            <label className="text-sm font-medium mb-2 block">Notes</label>
            <Textarea 
              rows={3} 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder="Optional notes about your day..." 
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={save} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Saving…" : (editingEntry ? "Update Entry" : "Create Entry")}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 