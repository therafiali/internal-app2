import { useState } from "react";
import { Link, useNavigate } from "@remix-run/react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "~/constant/_index";
import { departmentDefaultRoute } from "~/lib/access-policies";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Redirect to dashboard or home page after successful signin
        const department = data.user.user_metadata.department;
        navigate(department === "admin" ? "/" : `/home/${department}`);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                  required
                />
              </div>
              
              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-md p-3">
                  {error}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <Link
                  to="/auth/signup"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
