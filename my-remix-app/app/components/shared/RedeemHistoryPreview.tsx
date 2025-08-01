import { Dialog, DialogContent } from "../ui/dialog";

interface PaymentMethod {
  type: string;
  color: string;
  details: {
    cashtag: string;
    name: string;
  };
}

interface UserInfoData {
  userId: string;
  redeemId: string;
  timestamp: string;
  platform: string;
  username: string;
}

interface AmountDetailsData {
  totalAmount: number;
  amountHold: number;
  amountPaid: number;
  availableAmount: number;
}

interface AssociatedIdsData {
  description: string;
}

interface PaymentMethodsData {
  methods: PaymentMethod[];
}

type TimelineItemData =
  | AssociatedIdsData
  | UserInfoData
  | AmountDetailsData
  | PaymentMethodsData;

interface TimelineItem {
  id: string;
  title: string;
  type: "associated-ids" | "user-info" | "amount-details" | "payment-methods";
  data: TimelineItemData;
  status?: string;
}

interface RedeemHistoryPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  redeemId?: string;
  timelineData?: TimelineItem[];
}

// Default data
const defaultTimelineData: TimelineItem[] = [
  {
    id: "associated-ids",
    title: "Associated IDs",
    type: "associated-ids",
    data: { description: "Cashtag Assigned IDs" },
  },
  {
    id: "user-info",
    title: "James Stout",
    type: "user-info",
    status: "REJECTED",
    data: {
      userId: "HS-10029",
      redeemId: "R-UGUQX",
      timestamp: "7/1/2025, 10:46:50 PM",
      platform: "Ultra Panda",
      username: "Upjamesstout",
    },
  },
  {
    id: "amount-details",
    title: "Amount Details",
    type: "amount-details",
    data: {
      totalAmount: 150,
      amountHold: 0,
      amountPaid: 0,
      availableAmount: 150,
    },
  },
  {
    id: "payment-methods",
    title: "Payment Methods",
    type: "payment-methods",
    data: {
      methods: [
        {
          type: "Cashapp",
          color: "bg-blue-500",
          details: {
            cashtag: "$TIMBEAU55",
            name: "Timothy Hamilton",
          },
        },
      ],
    },
  },
];

const renderCardContent = (item: TimelineItem) => {
  switch (item.type) {
    case "associated-ids": {
      const data = item.data as AssociatedIdsData;
      return <p className="text-gray-300 text-sm">{data.description}</p>;
    }

    case "user-info": {
      const data = item.data as UserInfoData;
      return (
        <div>
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-white text-lg">{item.title}</h3>
            {item.status && (
              <span
                className={`font-semibold text-sm px-3 py-1 rounded-full ${
                  item.status === "REJECTED"
                    ? "text-red-400 bg-red-400/10"
                    : item.status === "APPROVED"
                    ? "text-green-400 bg-green-400/10"
                    : item.status === "PENDING"
                    ? "text-yellow-400 bg-yellow-400/10"
                    : "text-gray-400 bg-gray-400/10"
                }`}
              >
                {item.status}
              </span>
            )}
          </div>
          <div className="space-y-2 text-sm text-gray-300 mb-4">
            <p>{data.userId}</p>
            <p>Redeem ID: {data.redeemId}</p>
            <p>{data.timestamp}</p>
          </div>
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-gray-400 mb-1">Platform</p>
              <p className="text-white font-medium">{data.platform}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Username</p>
              <p className="text-white font-medium">{data.username}</p>
            </div>
          </div>
        </div>
      );
    }

    case "amount-details": {
      const data = item.data as AmountDetailsData;
      return (
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Amount</p>
              <p className="text-white font-semibold text-lg">
                ${data.totalAmount}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Amount Hold</p>
              <p className="text-white">${data.amountHold}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm mb-1">Amount Paid</p>
              <p className="text-white">${data.amountPaid}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Available Amount</p>
              <p className="text-white font-semibold text-lg">
                ${data.availableAmount}
              </p>
            </div>
          </div>
        </div>
      );
    }

    case "payment-methods": {
      const data = item.data as PaymentMethodsData;
      return (
        <div className="space-y-3">
          {data.methods.map((method, index) => (
            <div key={index}>
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 ${method.color} rounded-full`}
                ></div>
                <p className="text-white font-medium">{method.type}</p>
              </div>
              <div className="ml-6 space-y-2">
                <p className="text-white">{method.details.cashtag}</p>
                <p className="text-white">{method.details.name}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
};

export default function RedeemHistoryPreview({
  isOpen,
  onClose,
  redeemId = "R-UGUQX",
  timelineData = defaultTimelineData,
}: RedeemHistoryPreviewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 bg-gray-900 border-gray-700 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Redeem History</h2>
            <p className="text-sm text-gray-300">ID: {redeemId}</p>
          </div>
        </div>

        {/* Content with Timeline - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-gray-500 via-gray-600 to-gray-500"></div>

            {/* Timeline Items */}
            <div className="space-y-8">
              {timelineData.map((item) => (
                <div key={item.id} className="relative flex">
                  <div className="absolute left-6 top-8 w-5 h-5 bg-gray-700 rounded-full border-3 border-gray-600 -translate-x-1/2 z-10 shadow-lg"></div>
                  <div className="ml-12 flex-1">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-sm">
                      <h3 className="font-semibold text-white mb-3 text-lg">
                        {item.title}
                      </h3>
                      {renderCardContent(item)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
