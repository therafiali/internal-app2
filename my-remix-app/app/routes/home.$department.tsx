import StatBanner from "../components/shared/StatBanner";

const statusOptions = [
  { label: "Pending", value: "pending", color: "bg-yellow-500/20 text-yellow-700" },
  { label: "Processed", value: "processed", color: "bg-blue-500/20 text-blue-700" },
  { label: "Rejected", value: "rejected", color: "bg-red-500/20 text-red-700" },
];

type Section = "Recharge" | "Redeem";
type Status = "pending" | "processed" | "rejected";
type DummyRow = { id: number; user: string; amount: string; date: string };

type DummyData = {
  [key in Section]: {
    [status in Status]: DummyRow[];
  };
};

const dummyData: DummyData = {
  Recharge: {
    pending: [
      { id: 1, user: "Alice", amount: "$100", date: "2024-06-01" },
      { id: 2, user: "Bob", amount: "$200", date: "2024-06-02" },
      { id: 8, user: "Henry", amount: "$300", date: "2024-06-03" },
      { id: 9, user: "Ivy", amount: "$400", date: "2024-06-04" },
      { id: 10, user: "Jack", amount: "$500", date: "2024-06-05" },
    ],
    processed: [
      { id: 3, user: "Charlie", amount: "$150", date: "2024-05-30" },
      { id: 11, user: "Karen", amount: "$250", date: "2024-05-31" },
      { id: 12, user: "Leo", amount: "$350", date: "2024-05-29" },
    ],
    rejected: [
      { id: 4, user: "Dave", amount: "$50", date: "2024-05-28" },
      { id: 13, user: "Mona", amount: "$60", date: "2024-05-27" },
      { id: 14, user: "Nina", amount: "$70", date: "2024-05-26" },
    ],
  },
  Redeem: {
    pending: [
      { id: 5, user: "Eve", amount: "$80", date: "2024-06-01" },
      { id: 15, user: "Oscar", amount: "$90", date: "2024-06-02" },
      { id: 16, user: "Paul", amount: "$110", date: "2024-06-03" },
      { id: 17, user: "Quinn", amount: "$130", date: "2024-06-04" },
    ],
    processed: [
      { id: 6, user: "Frank", amount: "$120", date: "2024-05-29" },
      { id: 18, user: "Rita", amount: "$140", date: "2024-05-28" },
      { id: 19, user: "Sam", amount: "$160", date: "2024-05-27" },
    ],
    rejected: [
      { id: 7, user: "Grace", amount: "$60", date: "2024-05-27" },
      { id: 20, user: "Tom", amount: "$70", date: "2024-05-26" },
      { id: 21, user: "Uma", amount: "$80", date: "2024-05-25" },
    ],
  },
};

const getStats = (section: Section) =>
  statusOptions.map((status) => ({
    label: status.label,
    count: dummyData[section][status.value as Status].length,
    color: status.color,
  }));

const Home = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-2">Recharge</h2>
          <StatBanner stats={getStats("Recharge")} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Redeem</h2>
          <StatBanner stats={getStats("Redeem")} />
        </div>
        {/* Add more department logic here */}
      </main>
    </div>
  );
};

export default Home;
