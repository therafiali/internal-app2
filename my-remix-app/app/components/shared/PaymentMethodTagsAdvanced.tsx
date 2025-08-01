import React from "react";
import { useFetchPlayerPaymentMethodsUsingRedeemId } from "~/hooks/api/queries/useFetchPlayerPaymentMethodsUsingRedeemId";
import ImagePreview from "./ImagePreview";
import { Eye } from "lucide-react";

// Advanced component to display payment method tags for redeem requests with enhanced image preview
const PaymentMethodTagsAdvanced: React.FC<{
  redeemId: string;
  targetId: string;
}> = ({ redeemId, targetId }) => {
  const {
    data: paymentMethods,
    isLoading,
    error,
  } = useFetchPlayerPaymentMethodsUsingRedeemId(redeemId);

 

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
    <div className="flex flex-wrap gap-2">
      {filteredMethods.map((method, index) => (
        <div key={index} className="flex flex-col items-center gap-1">
          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            {method.tag_id}
          </span>
          {method.qr_code && (
            <ImagePreview
              src={method.qr_code}
              alt={`QR Code for tag ${method.tag_id}`}
              className="w-16 h-16"
            >
              <div className="relative group">
                <img
                  src={method.qr_code}
                  alt={`QR Code for tag ${method.tag_id}`}
                  className="w-8 h-8 object-cover border border-gray-600 rounded hover:border-blue-400 transition-colors"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center transition-all">
                  <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </ImagePreview>
          )}
        </div>
      ))}
    </div>
  );
};

export default PaymentMethodTagsAdvanced;
