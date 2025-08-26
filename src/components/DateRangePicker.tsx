"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (f: string, t: string) => void;
  onRefresh?: () => void;
  loading: boolean;
}

export default function DateRangePicker({ from, to, onChange, onRefresh, loading }: DateRangePickerProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div>
        <label className="text-sm font-medium">From</label>
        <Input 
          type="date" 
          value={from} 
          onChange={(e) => onChange(e.target.value, to)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="text-sm font-medium">To</label>
        <Input 
          type="date" 
          value={to} 
          onChange={(e) => onChange(from, e.target.value)}
          disabled={loading}
        />
      </div>
      {onRefresh && (
        <Button 
          onClick={onRefresh} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      )}
    
    </div>
  );
}