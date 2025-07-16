import React from "react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { supabase } from "~/hooks/use-auth";
import { useForm } from "react-hook-form";
import { useFetchPaymentMethods } from "../../hooks/api/queries/useFetchPaymentMethods";
import UploadImages from "../shared/UploadImages";

interface TagForm {
  tag_id: string;
  tag: string;
  qr_code: string;
  payment_method: string;
  balance: string;
  qr_code_url?: string;
}

export default function CreateTagDialog() {
  const [open, setOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TagForm>();

  const {
    data: paymentMethods,
    isLoading: isLoadingPaymentMethods,
    error: paymentMethodsError,
  } = useFetchPaymentMethods();

  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("");

  const onSubmit = async (data: TagForm) => {
    const payload = { ...data, qr_code: qrCodeUrl };
    const { error } = await supabase.from("company_tags").insert(payload);
    if (!error) {
      reset();
      setOpen(false);
      setQrCodeUrl("");
    } else {
      alert("Error creating tag: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">Create Tag</Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border border-gray-700 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-white">Create Tag</DialogTitle>
          <DialogDescription className="text-gray-400">
            Fill in the details to create a new tag.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <select
              id="payment_method_id"
              {...register("payment_method", { required: true })}
              className="w-full h-9 rounded-md border border-gray-700 bg-[#23272f] px-3 py-2 text-sm text-gray-100 shadow-sm"
              disabled={isLoadingPaymentMethods}
            >
              <option value="" disabled>
                {isLoadingPaymentMethods
                  ? "Loading..."
                  : "Select a payment method"}
              </option>
              {paymentMethods &&
                paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.payment_method}
                  </option>
                ))}
            </select>
            {errors.payment_method && (
              <span className="text-red-500 text-xs">
                Payment Method is required
              </span>
            )}
            {paymentMethodsError && (
              <span className="text-red-500 text-xs">
                Error loading payment methods
              </span>
            )}
          </div>
          <div>
            <Label htmlFor="tag_id">Tag ID</Label>
            <Input
              id="tag_id"
              {...register("tag_id", { required: true })}
              className="bg-[#23272f] border-gray-700 text-gray-100"
            />
            {errors.tag_id && (
              <span className="text-red-500 text-xs">Tag ID is required</span>
            )}
          </div>
          <div>
            <Label htmlFor="tag">Tag Name</Label>
            <Input
              id="tag"
              {...register("tag", { required: true })}
              className="bg-[#23272f] border-gray-700 text-gray-100"
            />
            {errors.tag && (
              <span className="text-red-500 text-xs">Tag is required</span>
            )}
          </div>
          <div>
            <Label htmlFor="qr_code">QR Code (single image)</Label>
            <UploadImages
              numberOfImages={1}
              onUpload={(urls) => {
                setQrCodeUrl(urls[0] || "");
              }}
              bucket="tags-qr-codes"
            />
            {qrCodeUrl && (
              <div className="text-green-400 text-xs mt-1">Image uploaded!</div>
            )}
          </div>
          <div>
            <Label htmlFor="balance">Current Balance</Label>
            <Input
              id="balance"
              type="number"
              step="any"
              {...register("balance", { required: true })}
              className="bg-[#23272f] border-gray-700 text-gray-100"
            />
            {errors.balance && (
              <span className="text-red-500 text-xs">Balance is required</span>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
