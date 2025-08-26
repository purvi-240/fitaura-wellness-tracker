"use client";
import { Entry } from "@/app/page";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

export function StepsChart({ entries }:{ entries: Entry[] }) {
const data = [...entries].sort((a,b)=>a.entry_date.localeCompare(b.entry_date)).map(e=>({ date: e.entry_date, steps: e.steps, sleep: e.sleep_hours }));
return (
<div className="h-72 rounded-xl border p-4">
<h3 className="mb-2 font-medium">Steps over time</h3>
<ResponsiveContainer width="100%" height="100%">
<LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="date" />
<YAxis />
<Tooltip />
<Line type="monotone" dataKey="steps" dot={false} />
</LineChart>
</ResponsiveContainer>
</div>
);
}

const MOOD_COLORS: Record<string, string> = { happy: "#22c55e", neutral: "#a3a3a3", tired: "#f59e0b", stressed: "#ef4444" };

export function MoodPie({ moodCounts }:{ moodCounts: Record<"happy"|"neutral"|"tired"|"stressed", number>; }) {
const data = Object.entries(moodCounts).map(([name, value])=>({ name, value }));
return (
<div className="h-72 rounded-xl border p-4">
<h3 className="mb-2 font-medium">Mood distribution</h3>
<ResponsiveContainer width="100%" height="100%">
<PieChart>
<Pie data={data} dataKey="value" nameKey="name" label>
{data.map((entry, index) => (
<Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name]} />
))}
</Pie>
<Tooltip />
</PieChart>
</ResponsiveContainer>
</div>
);
}