import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

type Status = { label: string; value: string };
type Props = {
  title: string;
  statuses: Status[];
  renderContent: (status: string) => React.ReactNode;
};

export default function DynamicSectionCard({
  title,
  statuses,
  renderContent,
}: Props) {
  const [activeStatus, setActiveStatus] = useState(statuses[0].value);

  return (
    <Card className="mb-6 bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <div className="flex gap-2 mt-2">
          {statuses.map((status) => (
            <button
              key={status.value}
              className={`px-3 py-1 rounded ${
                activeStatus === status.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
              onClick={() => setActiveStatus(status.value)}
            >
              {status.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>{renderContent(activeStatus)}</CardContent>
    </Card>
  );
}
