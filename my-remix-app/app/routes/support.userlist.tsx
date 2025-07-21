import { AppLayout } from "~/components/layout";
import PrivateRoute from "~/components/private-route";
import DynamicHeading from "~/components/shared/DynamicHeading";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useFetchPlayer } from "~/hooks/api/queries/useFetchPlayer";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useNavigate } from "@remix-run/react";
// import { useFetchPlayerCount } from "~/hooks/api/queries/useFetchPlayer";

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Define the row type to match the table structure
type PlayerRow = {
  id: string;
  fullname: string;
  team: string;
  phone: string;
  gender?: string;
  language?: string;
  timezone?: string | null;
};

const columns = [
  {
    header: "Player Name",
    accessorKey: "fullname",
  },
  {
    header: "Team",
    accessorKey: "team",
  },
  {
    header: "Phone",
    accessorKey: "phone",
  },
  {
    header: "Gender",
    accessorKey: "gender",
  },
  {
    header: "Language",
    accessorKey: "language",
  },
];



function SupportUserList() {
  const { data: players } = useFetchPlayer();
  const navigate = useNavigate();
  console.log(players,"players data");
  const pageCount = Math.ceil((50) / 10);
  
  const handleRowClick = (row: PlayerRow) => {
    const slug = createSlug(row.fullname);
    navigate(`/support/user/${slug}`);
  };

  const tableData: PlayerRow[] = (players || []).map((item) => ({
    id: item.id,
    fullname: item.firstname && item.lastname
      ? `${item.firstname} ${item.lastname}`.trim()
      : item.firstname || item.fullname || "N/A",
    team: item.teams?.team_code || "N/A",
    phone: item.phone || "N/A",
    gender: item.gender || "N/A",
    language: item.language || "N/A",
    timezone: item.timezone,
  }));  
  console.log(tableData,"table data");

  return (
    <PrivateRoute toDepartment="support">
      <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
        <DynamicHeading title="User List" />
        <DynamicTable 
          columns={columns} 
          data={tableData} 
          pagination={true}
          pageCount={pageCount}
          pageIndex={0}
          limit={10}
          onRowClick={handleRowClick}
        />
      </div>
    </PrivateRoute>
  )
}

export default SupportUserList;