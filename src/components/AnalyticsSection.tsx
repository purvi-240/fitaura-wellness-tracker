"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Entry } from "@/app/page";
import { StepsChart, MoodPie } from "./Charts";

interface AnalyticsSectionProps {
  entries: Entry[];
  totalSteps: number;
  avgSleep: number;
  moodCounts: Record<"happy" | "neutral" | "tired" | "stressed", number>;
}

type TimeRange = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y" | "All";

export default function AnalyticsSection({ entries }: AnalyticsSectionProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("All");

  const timeRanges: TimeRange[] = ["1D", "1W", "1M", "6M", "1Y", "5Y", "All"];

  // Filter entries based on selected time range
  const getFilteredEntries = () => {
    if (selectedRange === "All") return entries;
    
    const now = new Date();
    const startDate = new Date();
    
    switch (selectedRange) {
      case "1D":
        startDate.setDate(now.getDate() - 1);
        break;
      case "1W":
        startDate.setDate(now.getDate() - 7);
        break;
      case "1M":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "6M":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "5Y":
        startDate.setFullYear(now.getFullYear() - 5);
        break;
    }
    
    return entries.filter(entry => new Date(entry.entry_date) >= startDate);
  };

  const filteredEntries = getFilteredEntries();

  // Calculate stats for filtered entries
  const filteredStats = {
    totalSteps: filteredEntries.reduce((sum, e) => sum + (e.steps || 0), 0),
    avgSleep: filteredEntries.length ? (filteredEntries.reduce((sum, e) => sum + (e.sleep_hours || 0), 0) / filteredEntries.length) : 0,
    moodCounts: filteredEntries.reduce((counts, e) => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
      return counts;
    }, { happy: 0, neutral: 0, tired: 0, stressed: 0 } as Record<Entry["mood"], number>)
  };

  const summaryCards = [
    { title: "Total Steps", value: filteredStats.totalSteps.toLocaleString() },
    { title: "Avg Sleep (hrs)", value: filteredStats.avgSleep.toFixed(2) },
    { title: "Happy", value: filteredStats.moodCounts.happy },
    { title: "Neutral", value: filteredStats.moodCounts.neutral },
    { title: "Tired", value: filteredStats.moodCounts.tired },
    { title: "Stressed", value: filteredStats.moodCounts.stressed },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
      {/* Time Range Tabs */}
      <div className="flex flex-wrap gap-1 mb-6">
        {timeRanges.map((range) => (
          <Button
            key={range}
            variant={selectedRange === range ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedRange(range)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              selectedRange === range
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-blue-100"
            }`}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Summary Cards and Charts */}
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {summaryCards.map((card) => (
            <Card key={card.title} className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 font-medium">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold text-gray-900">
                {card.value}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Steps Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StepsChart entries={filteredEntries} />
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Mood Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MoodPie moodCounts={filteredStats.moodCounts} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 