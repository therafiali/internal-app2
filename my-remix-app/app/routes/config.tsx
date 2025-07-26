import EntTeamModal from "../components/shared/EntTeamModal";
import { Button } from "../components/ui/button";
import { DynamicTable } from "../components/shared/DynamicTable";
import { useFetchAllTeams } from "../hooks/api/queries/useFetchTeams";
import PaymentMethodModal from "~/components/shared/PaymentMethodModal";
import { useFetchPaymentMethods } from "~/hooks/api/queries/useFetchPaymentMethods";
import AllGamesModal from "~/components/shared/AddGamesModal";
import { useFetchAllGames } from "~/hooks/api/queries/useFetchGames";

const Config = () => {
  const { data: teams = [], isLoading, error } = useFetchAllTeams();
  const { data: paymentMethods = [] } = useFetchPaymentMethods();
  const { data: games = [] } = useFetchAllGames();

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

  const gameColumns = [
    {
      accessorKey: "game_name",
      header: "Game Name",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">
          Configuration
        </h1>
        <p className="text-gray-400 mb-8">
          Manage your teams, payment methods, and games here.
        </p>
      </main>

      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {isLoading ? (
          <div className="text-white">Loading teams...</div>
        ) : error ? (
          <div className="text-red-500">Error loading teams</div>
        ) : (
          <>
            {/* Teams Section */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">ENT Teams</h2>
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
              </div>
              <DynamicTable columns={columns} data={teams} />
            </div>

            {/* Payment Methods Section */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Payment Methods
                </h2>
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
              </div>
              <DynamicTable
                columns={paymentMethodColumns}
                data={paymentMethods}
              />
            </div>

            {/* Games Section */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Games</h2>
                <AllGamesModal
                  onSubmit={(data) => {
                    alert(`Game Created: ${data.gameName}`);
                  }}
                >
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    + New Game
                  </Button>
                </AllGamesModal>
              </div>
              <DynamicTable
                columns={gameColumns}
                data={Array.isArray(games) ? games : games?.data || []}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Config;
