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
import { supabase } from "../../hooks/use-auth";
import * as React from "react";
import { useFetchDepartments } from "../../hooks/api/queries/useFectchDepartments";
import { useFetchTeams } from "../../hooks/api/queries/useFetchTeams";
import { EntSelectorChips } from "../shared/EntSelectorChips";

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
  setForm: React.Dispatch<React.SetStateAction<CreateProfileProps["form"]>>;
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
  const { data: departments } = useFetchDepartments();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: ents } = useFetchTeams();
  const [availableRoles, setAvailableRoles] = React.useState<string[]>([]);

  // Create a unique list of departments by department_name
  const uniqueDepartments =
    departments?.reduce(
      (acc: typeof departments, curr: (typeof departments)[number]) => {
        if (!acc.find((d) => d.department_name === curr.department_name)) {
          acc.push(curr);
        }
        return acc;
      },
      []
    ) || [];

  // Get all roles for the selected department_name
  const selectedDepartmentName = uniqueDepartments.find(
    (d) => d.id === form.department
  )?.department_name;

  const rolesForSelectedDepartment = departments
    ? departments
        .filter((d) => d.department_name === selectedDepartmentName)
        .map((d) => d.department_role)
        .filter(Boolean)
    : [];

  console.log("departments", departments);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange(e);
    const selectedDeptId = e.target.value;
    const selectedDept = departments?.find((d) => d.id === selectedDeptId);
    setAvailableRoles(selectedDept?.department_role || []);

    // Clear role and ents when department changes
    setForm((prev: CreateProfileProps["form"]) => ({
      ...prev,
      role: "",
      ents: [], // Clear ents when department changes
    }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange(e);
    const selectedRole = e.target.value;
    const selectedDepartmentName = uniqueDepartments.find(
      (d) => d.id === form.department
    )?.department_name;

    // Clear ents when role changes and new role doesn't qualify for ents
    const shouldShowEnts =
      selectedDepartmentName &&
      selectedDepartmentName.toLowerCase() === "support" &&
      (selectedRole.toLowerCase() === "agent" ||
        selectedRole.toLowerCase() === "shift incharge");

    if (!shouldShowEnts) {
      setForm((prev: CreateProfileProps["form"]) => ({
        ...prev,
        ents: [], // Clear ents when role doesn't qualify
      }));
    }
  };

  React.useEffect(() => {
    if (form.department && departments) {
      const selectedDept = departments.find((d) => d.id === form.department);
      setAvailableRoles(selectedDept?.department_role || []);
    } else {
      setAvailableRoles([]);
    }
  }, [form.department, departments]);

  console.log("availableRoles", availableRoles);

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
            <Label htmlFor="department">Department</Label>
            <select
              id="department"
              name="department"
              value={form.department}
              onChange={handleDepartmentChange}
              className="w-full h-9 rounded-md border border-gray-700 bg-[#23272f] px-3 py-2 text-sm text-gray-100 shadow-sm"
              required
            >
              <option value="" disabled>
                Select a department
              </option>
              {uniqueDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.department_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleRoleChange}
              className="w-full h-9 rounded-md border border-gray-700 bg-[#23272f] px-3 py-2 text-sm text-gray-100 shadow-sm"
              required
            >
              <option value="" disabled>
                Select a role
              </option>
              {rolesForSelectedDepartment.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            {(() => {
              const selectedDepartmentName = uniqueDepartments.find(
                (d) => d.id === form.department
              )?.department_name;

              // Show ents selector only for support department with agent or shift incharge role
              const shouldShowEnts =
                selectedDepartmentName &&
                selectedDepartmentName.toLowerCase() === "support" &&
                (form.role.toLowerCase() === "agent" ||
                  form.role.toLowerCase() === "shift incharge");

              return shouldShowEnts ? (
                <>
                  <Label htmlFor="ents">Ents</Label>
                  <EntSelectorChips
                    value={form.ents}
                    onChange={(newEnts) => {
                      setForm((prev: CreateProfileProps["form"]) => ({
                        ...prev,
                        ents: newEnts,
                      }));
                    }}
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Select the teams this support user can work with
                  </p>
                </>
              ) : null;
            })()}
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
                const selectedDepartmentName = uniqueDepartments.find(
                  (d) => d.id === form.department
                )?.department_name;
                const { data, error } = await supabase.auth.signUp({
                  email: form.email,
                  password: form.password,
                  options: {
                    data: {
                      name: form.name,
                      role: form.role,
                      department: selectedDepartmentName,
                    },
                  },
                });
                console.log(data, error);
                console.log("form", form);
                console.log(
                  "rolesForSelectedDepartment",
                  departments?.filter((item) => {
                    return item.department_role === form.role;
                  })
                );

                const getSelectedRoleId = departments?.filter((item) => {
                  return item.department_role === form.role;
                });
                const { data: userData, error: userError } = await supabase
                  .from("users")
                  .insert({
                    email: form.email,
                    name: form.name,
                    employee_code: form.employeeCode,
                    role: form.role,
                    // department: form.department,
                    department_id: getSelectedRoleId?.[0]?.id,
                    ents:
                      form.role.toLowerCase() === "agent" ||
                      form.role.toLowerCase() === "shift incharge"
                        ? form.ents // Pass specific selected ents for agent/shift incharge
                        : ents, // Pass all ents for other roles
                    // if support agent or shift incharge role then ent_access is 1 else 0
                    ent_access:
                      form.role.toLowerCase() === "agent" ||
                      form.role.toLowerCase() === "shift incharge"
                        ? "special"
                        : "all",
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
