import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

const paymentMethods = [
  "Cashapp",
  "Venmo",
  "Chime",
  "Strike",
  "PayPal",
  "USDC",
  "PYUSD",
];

export default function SupportSubmitRequest() {
  const [open, setOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [form, setForm] = useState({
    player: "",
    platform: "",
    amount: "",
    promo: "",
    page: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      paymentMethod: selectedPayment,
    };
    // You can now use 'data' to insert into your DB
    console.log("Submit Recharge Request Data:", data);
    // Optionally close modal or reset form here
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#18181b]">
      <Button
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => setOpen(true)}
      >
        Submit Recharge Request
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl w-full bg-[#23272f] border border-gray-700 text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-white">
              Submit Recharge Request
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Search Player</Label>
              <div className="relative mt-1">
                <Input
                  name="player"
                  value={form.player}
                  onChange={handleChange}
                  placeholder="Search by Name or Account ID"
                  className="bg-[#18181b] border-gray-700 text-gray-100 pl-3"
                />
              </div>
            </div>
            <div>
              <Label>Game Platform</Label>
              <select
                name="platform"
                value={form.platform}
                onChange={handleChange}
                className="w-full h-9 rounded-md border border-gray-700 bg-[#18181b] px-3 py-2 text-sm text-gray-100 shadow-sm mt-1"
              >
                <option value="">Select game platform...</option>
                <option value="platform1">Platform 1</option>
                <option value="platform2">Platform 2</option>
              </select>
            </div>
            <div>
              <Label>Deposit Amount</Label>
              <div className="relative mt-1">
                <Input
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="$ Enter amount..."
                  className="bg-[#18181b] border-gray-700 text-gray-100 pl-3"
                  type="number"
                />
              </div>
            </div>
            <div>
              <Label>Deposit Payment Methods</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {paymentMethods.map((method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setSelectedPayment(method)}
                    className={`flex items-center justify-center border rounded-lg p-3 transition text-gray-100 font-semibold text-base
                      ${
                        selectedPayment === method
                          ? "bg-blue-700 border-blue-500"
                          : "bg-[#18181b] border-gray-700 hover:bg-[#23272f]"
                      }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
              {selectedPayment && (
                <div className="text-xs text-blue-400 mt-1">
                  Selected: {selectedPayment}
                </div>
              )}
            </div>
            <div>
              <Label>Promo Code</Label>
              <div className="flex gap-2 mb-1">
                <Button
                  type="button"
                  size="sm"
                  className="bg-green-700 hover:bg-green-800 text-white"
                >
                  Fetch Promo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-gray-700 hover:bg-gray-800 text-white"
                >
                  Referral Bonus
                </Button>
              </div>
              <Input
                name="promo"
                value={form.promo}
                onChange={handleChange}
                placeholder="No promotions available"
                className="bg-[#18181b] border-gray-700 text-gray-400"
              />
            </div>
            <div>
              <Label>Page Name</Label>
              <select
                name="page"
                value={form.page}
                onChange={handleChange}
                className="w-full h-9 rounded-md border border-gray-700 bg-[#18181b] px-3 py-2 text-sm text-gray-100 shadow-sm mt-1"
              >
                <option value="">Select page...</option>
                <option value="page1">Page 1</option>
                <option value="page2">Page 2</option>
              </select>
            </div>
            <Button
              //   type="submit"
              onClick={handleSubmit}
              className="w-full bg-blue-700 hover:bg-blue-800 mt-2"
            >
              Submit Recharge Request
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
