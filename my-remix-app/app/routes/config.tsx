import EntTeamModal from "../components/shared/EntTeamModal";
import { Button } from "../components/ui/button";
import { DynamicTable } from "../components/shared/DynamicTable";
import { useFetchAllTeams } from "../hooks/api/queries/useFetchTeams";
import PaymentMethodModal from "~/components/shared/PaymentMethodModal";
import { useFetchPaymentMethods } from "~/hooks/api/queries/useFetchPaymentMethods";

const Config = () => {
  const { data: teams = [], isLoading, error } = useFetchAllTeams();
  const { data: paymentMethods = [] } = useFetchPaymentMethods();
  const columns = [
    {
      accessorKey: "team_code",
      header: "Team Code",
    },
    {
      accessorKey: "team_name",
      header: "Team Name",
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ getValue }: { getValue: () => string }) =>
        new Date(getValue()).toLocaleString(),
    },
  ];

  const paymentMethodColumns = [
    {
      accessorKey: "payment_method",
      header: "Payment Method",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Config</h1>
      </main>

      <div className="max-w-4xl mx-auto mt-8">
        {isLoading ? (
          <div className="text-white">Loading teams...</div>
        ) : error ? (
          <div className="text-red-500">Error loading teams</div>
        ) : (
          <>
            <EntTeamModal
              onSubmit={(data) => {
                alert(`Team Created: ${data.teamCode} - ${data.teamName}`);
              }}
            >
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                + New ENT Team
              </Button>
            </EntTeamModal>
            <DynamicTable columns={columns} data={teams} />

            <PaymentMethodModal
              onSubmit={(data) => {
                alert(`Payment Method Created: ${data.paymentMethod}`);
              }}
            >
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                + New Payment Method
              </Button>
            </PaymentMethodModal>
            <DynamicTable
              columns={paymentMethodColumns}
              data={paymentMethods}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Config;
