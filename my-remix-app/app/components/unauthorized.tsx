
import { Lock } from "lucide-react";
import { Link } from "@remix-run/react";

export default function Unauthorized() {
  return (
    <div className="flex flex-col h-screen items-center justify-center min-h-[60vh] px-4 bg-[#18181b] shadow-lg">
      <div className="bg-[#27272a] rounded-full p-4 mb-6">
        <Lock className="h-12 w-12 text-red-400" />
      </div>
      <h1 className="text-3xl font-bold text-red-400 mb-2">Access Denied</h1>
      <p className="text-lg text-gray-200 mb-4 max-w-xl text-center">
        You do not have permission to view this page.
        <br />
        If you believe this is a mistake, please contact your administrator or
        support team.
      </p>
      <div className="flex gap-4 mt-4">
       
        <Link
          to="/auth/signin"
          className="px-6 py-2 rounded-md bg-green-700 text-white font-semibold hover:bg-green-800 transition border border-green-800 shadow"
        >
          Login
        </Link>
       
      </div>
      <div className="mt-8 text-sm text-gray-500">
        Error Code: <span className="font-mono">403</span>
      </div>
    </div>
  );
}
