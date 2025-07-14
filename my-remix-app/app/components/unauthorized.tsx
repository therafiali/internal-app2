import React from "react";
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
          to="/"
          className="px-6 py-2 rounded-md bg-blue-700 text-white font-semibold hover:bg-blue-800 transition border border-blue-800 shadow"
        >
          Go to Dashboard
        </Link>
        <a
          href="mailto:support@example.com"
          className="px-6 py-2 rounded-md bg-[#23272f] text-gray-200 font-semibold hover:bg-[#2a2e37] transition border border-gray-700 shadow"
        >
          Contact Support
        </a>
      </div>
      <div className="mt-8 text-sm text-gray-500">
        Error Code: <span className="font-mono">403</span>
      </div>
    </div>
  );
}
