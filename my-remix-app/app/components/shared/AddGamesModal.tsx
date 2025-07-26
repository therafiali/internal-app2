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

interface AllGamesModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: { gameName: string; gameUrl?: string }) => void;
  children?: React.ReactNode; // for DialogTrigger
}

export default function AllGamesModal({
  open,
  onOpenChange,
  onSubmit,
  children,
}: AllGamesModalProps) {
  const form = useForm<{ gameName: string; gameUrl?: string }>({
    defaultValues: { gameName: "", gameUrl: "" },
  });
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleFormSubmit = async (data: {
    gameName: string;
    gameUrl?: string;
  }) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error } = await supabase.from("games").insert({
      game_name: data.gameName,
      game_url: data.gameUrl || null,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message || "Failed to create game");
    } else {
      setSuccessMsg("Game created successfully!");
      onSubmit(data);
      // Optionally close the dialog
      if (onOpenChange) onOpenChange(false);
      form.reset({ gameName: "", gameUrl: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Game</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="gameName"
              rules={{ required: "Game name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Polo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gameUrl"
              rules={{}}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/game" {...field} />
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
                {loading ? "Creating..." : "Create Game"}
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
