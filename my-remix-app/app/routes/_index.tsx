import { useAuthContext } from "~/components/auth-provider";
import { Profile } from "~/components/profile";
import { Button } from "~/components/ui/button";
import { Link } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "~/hooks/use-auth";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import * as React from "react";
import UsersList from "~/components/lists/users";

export default function Index() {
  const { isAuthenticated, user } = useAuthContext();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    email: "",
    name: "",
    password: "",
    employeeCode: "",
    role: "",
    department: "",
    ents: [] as string[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "ents") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        ents: checked
          ? [...prev.ents, value]
          : prev.ents.filter((ent) => ent !== value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-white">
            Welcome to Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Please sign in to continue</p>
          <div className="space-x-4">
            <Link to="/auth/signin">
              <Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
            </Link>
            <Link to="/auth/signup">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">
                Welcome, {user?.email}
              </span>
              <Profile />
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setOpen(true)}
                  >
                    Create Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Profile</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create your profile.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="employeeCode">Employee Code</Label>
                      <Input
                        id="employeeCode"
                        name="employeeCode"
                        type="text"
                        value={form.employeeCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                        required
                      >
                        <option value="" disabled>
                          Select a role
                        </option>
                        <option value="admin">Admin</option>
                        <option value="executive">Executive</option>
                        <option value="manager">Manager</option>
                        <option value="agent">Agent</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <select
                        id="department"
                        name="department"
                        value={form.department}
                        onChange={handleChange}
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                        required
                      >
                        <option value="" disabled>
                          Select a department
                        </option>
                        <option value="finance">Finance</option>
                        <option value="support">Support</option>
                        <option value="verification">Verification</option>
                        <option value="operation">Operation</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <Label>Ents</Label>
                      <div className="flex gap-4">
                        {["ent1", "ent2", "ent3"].map((ent) => (
                          <label key={ent} className="flex items-center gap-2">
                            <Checkbox
                              name="ents"
                              value={ent}
                              checked={form.ents.includes(ent)}
                              onCheckedChange={(checked) => {
                                setForm((prev) => ({
                                  ...prev,
                                  ents: checked
                                    ? [...prev.ents, ent]
                                    : prev.ents.filter((e) => e !== ent),
                                }));
                              }}
                            />
                            {ent}
                          </label>
                        ))}
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        // type="submit"
                        onClick={async (e) => {
                          e.preventDefault();
                          console.log(form);
                          // signup with admin
                          const { data, error } = await supabase.auth.signUp({
                            email: form.email,
                            password: form.password,
                            options: {
                              data: {
                                name: form.name,
                                role: form.role,
                                department: form.department,
                              },
                            },
                          });
                          console.log(data, error);
                          const { data: userData, error: userError } =
                            await supabase.from("users").insert({
                              email: form.email,
                              name: form.name,
                              // password: form.password,
                              role: form.role,
                              department: form.department,
                              ents: form.ents,
                              id: data.user?.id,
                            });
                          console.log(userData, userError);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Create
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">
            Welcome to your Dashboard
          </h2>
          <p className="text-gray-400 mb-6">
            You are now authenticated and can access all features. Click on your
            profile avatar in the top right to view your account details.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Profile</h3>
              <p className="text-gray-400 text-sm">
                View and manage your account information
              </p>
            </div>
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Settings
              </h3>
              <p className="text-gray-400 text-sm">
                Configure your application preferences
              </p>
            </div>
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Analytics
              </h3>
              <p className="text-gray-400 text-sm">
                View your usage statistics and insights
              </p>
            </div>
          </div>
        </div>
        <UsersList />
      </main>
    </div>
  );
}
