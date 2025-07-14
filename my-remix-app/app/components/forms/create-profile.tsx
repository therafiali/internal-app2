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
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { supabase } from "~/hooks/use-auth";
import * as React from "react";

interface CreateProfileProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  form: {
    email: string;
    name: string;
    password: string;
    employeeCode: string;
    role: string;
    department: string;
    ents: string[];
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export default function CreateProfileDialog({
  open,
  setOpen,
  form,
  setForm,
  handleChange,
}: CreateProfileProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Create Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border border-gray-700 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-white">Create Profile</DialogTitle>
          <DialogDescription className="text-gray-400">
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
              className="bg-[#23272f] border-gray-700 text-gray-100"
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
              className="bg-[#23272f] border-gray-700 text-gray-100"
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
              className="bg-[#23272f] border-gray-700 text-gray-100"
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
              className="bg-[#23272f] border-gray-700 text-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full h-9 rounded-md border border-gray-700 bg-[#23272f] px-3 py-2 text-sm text-gray-100 shadow-sm"
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
              className="w-full h-9 rounded-md border border-gray-700 bg-[#23272f] px-3 py-2 text-sm text-gray-100 shadow-sm"
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
                      setForm((prev: any) => ({
                        ...prev,
                        ents: checked
                          ? [...prev.ents, ent]
                          : prev.ents.filter((e: string) => e !== ent),
                      }));
                    }}
                  />
                  <span className="text-gray-200">{ent}</span>
                </label>
              ))}
            </div>
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
                const { data: userData, error: userError } = await supabase
                  .from("users")
                  .insert({
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
  );
}
