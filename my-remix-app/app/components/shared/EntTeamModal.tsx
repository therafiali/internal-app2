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
import { supabase } from "../../hooks/use-auth";

interface EntTeamModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: { teamCode: string; teamName: string }) => void;
  children?: React.ReactNode; // for DialogTrigger
}

export default function EntTeamModal({
  open,
  onOpenChange,
  onSubmit,
  children,
}: EntTeamModalProps) {
  const form = useForm<{ teamCode: string; teamName: string }>({
    defaultValues: { teamCode: "ent1", teamName: "" },
  });
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleFormSubmit = async (data: {
    teamCode: string;
    teamName: string;
  }) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error } = await supabase.from("teams").insert({
      team_code: data.teamCode.toLowerCase(),
      team_name: data.teamName,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message || "Failed to create team");
    } else {
      setSuccessMsg("Team created successfully!");
      onSubmit && onSubmit(data);
      // Optionally close the dialog
      if (onOpenChange) onOpenChange(false);
      form.reset({ teamCode: "ent1", teamName: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New ENT Team</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="teamCode"
              rules={{ required: "Team code is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Code</FormLabel>
                  <FormControl>
                    <Input placeholder="ent1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="teamName"
              rules={{ required: "Team name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Team Name" {...field} />
                  </FormControl>
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
                {loading ? "Creating..." : "Create Team"}
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
