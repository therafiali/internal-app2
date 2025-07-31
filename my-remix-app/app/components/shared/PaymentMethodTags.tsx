import React, { useState } from "react";
import { useFetchPlayerPaymentMethodsUsingRedeemId } from "~/hooks/api/queries/useFetchPlayerPaymentMethodsUsingRedeemId";
import { Dialog, DialogContent } from "../ui/dialog";
import { Eye, X } from "lucide-react";

// Component to display payment method tags for redeem requests
const PaymentMethodTags: React.FC<{ redeemId: string; targetId: string }> = ({
  redeemId,
  targetId,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const {
    data: paymentMethods,
    isLoading,
    error,
  } = useFetchPlayerPaymentMethodsUsingRedeemId(redeemId);

  console.log(error, "error");
  console.log(paymentMethods, "paymentMethods123");

  if (isLoading) {
    return <span className="text-gray-400">Loading...</span>;
  }

  if (error) {
    return <span className="text-red-400">Error loading tags</span>;
  }

  if (!paymentMethods || paymentMethods.length === 0) {
    return <span className="text-gray-400">No tags</span>;
  }

  const filteredMethods = paymentMethods.filter(
    (method) => method.payment_method.payment_method == targetId
  );

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {filteredMethods.map((method, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {method.tag_id}
            </span>
            {method.qr_code && (
              <div className="relative group">
                <button
                  onClick={() => setPreviewImage(method.qr_code)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPreviewImage(method.qr_code);
                    }
                  }}
                  className="p-0 border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded"
                  aria-label={`View QR code for tag ${method.tag_id}`}
                >
                  <img
                    src={method.qr_code}
                    alt="QR Code"
                    className="w-16 h-16 object-cover border border-gray-600 rounded hover:border-blue-400 transition-colors"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center transition-all">
                    <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => setPreviewImage(open ? previewImage : null)}
      >
        <DialogContent className="flex flex-col items-center bg-[#18181b] max-w-md">
          {previewImage && (
            <>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  QR Code Preview
                </h3>
                <p className="text-gray-400 text-sm">
                  Click outside or press ESC to close
                </p>
              </div>
              <div className="relative">
                <img
                  src={previewImage}
                  alt="QR Code Full Preview"
                  className="max-w-xs max-h-[60vh] rounded shadow-lg border border-gray-600"
                />
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentMethodTags;
