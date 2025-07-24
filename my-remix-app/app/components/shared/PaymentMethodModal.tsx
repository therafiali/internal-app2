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

interface PaymentMethodModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: { paymentMethod: string }) => void;
  children?: React.ReactNode; // for DialogTrigger
}

export default function PaymentMethodModal({
  open,
  onOpenChange,
  onSubmit,
  children,
}: PaymentMethodModalProps) {
  const form = useForm<{ paymentMethod: string }>({
    defaultValues: { paymentMethod: "" },
  });
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleFormSubmit = async (data: { paymentMethod: string }) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error } = await supabase.from("payment_methods").insert({
      payment_method: data.paymentMethod,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message || "Failed to create team");
    } else {
      setSuccessMsg("Team created successfully!");
      onSubmit(data);
      // Optionally close the dialog
      if (onOpenChange) onOpenChange(false);
      form.reset({ paymentMethod: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Payment Method</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="paymentMethod"
              rules={{ required: "Payment method is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <Input placeholder="Cashapp" {...field} />
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
                {loading ? "Creating..." : "Create Payment Method"}
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
