import { Card } from "../ui/card";

type Stat = {
  label: string;
  count: number;
  color: string;
};

export default function StatBanner({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex gap-4 mb-6">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`flex-1 flex flex-col items-center py-6 ${stat.color} border-0 shadow`}
        >
          <span className="text-lg font-semibold">{stat.label}</span>
          <span className="text-3xl font-bold mt-2">{stat.count}</span>
        </Card>
      ))}
    </div>
  );
}
