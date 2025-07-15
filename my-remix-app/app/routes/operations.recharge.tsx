
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/dialog";

// Initialize Supabase client
const supabaseUrl = "https://qrjaavsmkbhzmxnylwfx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyamFhdnNta2Joem14bnlsd2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNDQ4NjUsImV4cCI6MjA2NzcyMDg2NX0.UTAMZRRe4H7LessU_nmn80ISJKOaS7NlSjqMmc71zuo";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RechargePage() {
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("recharge_requests")
        .select(`
          id,
          recharge_id,
          amount,
          process_status,
          created_at,
          player:player_id (
            fullname,
            firstname,
            lastname,
            profilepic
          ),
          team:team_id (
            team_code
          )
        `)
        .order("created_at", { ascending: false });
      if (!error) {
        setData(data || []);
        console.log("Supabase recharge_requests data:", data); // <-- Added for debugging
      }
    }
    fetchData();
  }, []);

  const columns = [
    { accessorKey: "recharge_id", header: "Recharge ID" },
    { accessorKey: "amount", header: "Amount" },
    { accessorKey: "process_status", header: "Status" },
    {
      accessorKey: "player",
      header: "Player",
      cell: ({ row }: any) =>
        row.original.player
          ? row.original.player.fullname ||
            `${row.original.player.firstname} ${row.original.player.lastname}`
          : "N/A",
    },
    {
      accessorKey: "team",
      header: "Team",
      cell: ({ row }: any) =>
        row.original.team ? row.original.team.team_code : "N/A",
    },
    {
      accessorKey: "actions",
      header: "ACTIONS",
      cell: ({ row }: any) => (
        <Button
          onClick={() => {
            setSelectedRow(row.original);
            setOpen(true);
          }}
        >
          Process
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <DynamicHeading title="Recharge Requests" />
      <div className="mt-6">
        <DynamicTable columns={columns} data={data} />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recharge Details</DialogTitle>
            <DialogDescription>
              Details for this recharge request.
            </DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="my-4">
              <div>
                <b>Recharge ID:</b> {selectedRow.recharge_id}
              </div>
              <div>
                <b>Amount:</b> {selectedRow.amount}
              </div>
              <div>
                <b>Status:</b> {selectedRow.process_status}
              </div>
              <div>
                <b>Player:</b>{" "}
                {selectedRow.player
                  ? selectedRow.player.fullname ||
                    `${selectedRow.player.firstname} ${selectedRow.player.lastname}`
                  : "N/A"}
              </div>
              <div>
                <b>Team:</b> {selectedRow.team ? selectedRow.team.team_code : "N/A"}
              </div>
              <div>
                <b>Created At:</b> {selectedRow.created_at}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                Reject
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button className="bg-green-600 hover:bg-green-700">Approve</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}