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
import { useCreatePlayer } from "../../hooks/api/mutations/useCreatePlayer";
import { useAuth } from "../../hooks/use-auth";
import { useFetchPlayer } from "../../hooks/api/queries/useFetchPlayer";

interface PlayerFormData {
  fullname: string;
  gender?: string;
  teamId: string;
  referred_by?: string;
}

interface UserActivityModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: PlayerFormData) => void;
  children?: React.ReactNode; // for DialogTrigger
}

export default function UserActivityModal({
  open,
  onOpenChange,
  onSubmit,
  children,
}: UserActivityModalProps) {
  const { data: teams = [] } = useFetchAllTeams();
  const { data: players = [] } = useFetchPlayer();
  const createPlayerMutation = useCreatePlayer();
  const { user } = useAuth();

  const form = useForm<PlayerFormData>({
    defaultValues: {
      fullname: "",
      gender: "",
      teamId: "",
      referred_by: "",
    },
  });

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      form.reset({
        fullname: "",
        gender: "",
        teamId: "",
        referred_by: "",
      });
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [open, form]);

  const handleFormSubmit = async (data: PlayerFormData) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Use the mutation to create the player
      await createPlayerMutation.mutateAsync({
        fullname: data.fullname,
        gender: data.gender,
        team_id: data.teamId,
        referred_by: data.referred_by,
        created_by: user?.id,
      });

      // Call the onSubmit callback with the form data
      onSubmit(data);
      setSuccessMsg("Player created successfully!");

      // Reset form and close dialog
      form.reset({
        fullname: "",
        gender: "",
        teamId: "",
      });
      if (onOpenChange) onOpenChange(false);
    } catch (error) {
      console.error("Error creating player:", error);
      setErrorMsg(
        error instanceof Error ? error.message : "Failed to create player"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Player</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="fullname"
              rules={{ required: "Full name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender (Optional)</FormLabel>
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

            <FormField
              control={form.control}
              name="referred_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referred By (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select referring player (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.fullname ||
                            `${player.firstname || ""} ${
                              player.lastname || ""
                            }`.trim()}
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
              <Button type="submit" disabled={createPlayerMutation.isPending}>
                {createPlayerMutation.isPending
                  ? "Creating Player..."
                  : "Create Player"}
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
