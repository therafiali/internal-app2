import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useFetchAllTeams } from "../../hooks/api/queries/useFetchTeams";
import { supabase } from "../../hooks/use-auth";

interface UserActivityModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: {
    playerName: string;
    gender: string;
    teamId: string;
  }) => void;
  children?: React.ReactNode; // for DialogTrigger
}

export default function UserActivityModal({
  open,
  onOpenChange,
  onSubmit,
  children,
}: UserActivityModalProps) {
  const { data: teams = [] } = useFetchAllTeams();

  const form = useForm<{ playerName: string; gender: string; teamId: string }>({
    defaultValues: {
      playerName: "",
      gender: "",
      teamId: "",
    },
  });

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

    const handleFormSubmit = async (data: {
    playerName: string;
    gender: string;
    teamId: string;
  }) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
      // Insert data into Supabase players table
      const { error } = await supabase.from("players").insert({
        fullname: data.playerName,
        team_id: data.teamId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      // Call the onSubmit callback with the form data
      onSubmit(data);
      setSuccessMsg("User activity submitted successfully!");
      
      // Reset form and close dialog
      form.reset({ playerName: "", gender: "", teamId: "" });
      if (onOpenChange) onOpenChange(false);
    } catch (error) {
      console.error("Error inserting player:", error);
      setErrorMsg(error instanceof Error ? error.message : "Failed to submit user activity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User Activity</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="playerName"
              rules={{ required: "Player name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter player name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              rules={{ required: "Gender is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teamId"
              rules={{ required: "Team is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.team_code.toUpperCase()} - {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}
            {successMsg && (
              <div className="text-green-500 text-sm">{successMsg}</div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Activity"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
