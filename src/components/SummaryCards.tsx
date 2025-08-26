import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SummaryCards({ totalSteps, avgSleep, moodCounts }:{ totalSteps:number; avgSleep:number; moodCounts: Record<"happy"|"neutral"|"tired"|"stressed", number>; }) {
  const cards = [
    { title: "Total Steps", value: totalSteps.toLocaleString() },
    { title: "Avg Sleep (hrs)", value: avgSleep.toFixed(2) },
    { title: "Happy", value: moodCounts.happy },
    { title: "Neutral", value: moodCounts.neutral },
    { title: "Tired", value: moodCounts.tired },
    { title: "Stressed", value: moodCounts.stressed },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{c.value}</CardContent>
        </Card>
      ))}
    </div>
  );
}