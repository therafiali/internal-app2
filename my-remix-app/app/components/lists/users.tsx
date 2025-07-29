import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../hooks/use-auth";
import { Button } from "../ui/button";
import { DynamicTable } from "../shared/DynamicTable";
import { SearchBar } from "../shared/SearchBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useFetchDepartments } from "../../hooks/api/queries/useFectchDepartments";
import { useFetchTeams } from "../../hooks/api/queries/useFetchTeams";
import { EntSelectorChips } from "../shared/EntSelectorChips";

interface Department {
  id: string;
  department_name: string;
  department_role?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: Department | string;
  ents: string[] | null;
  active_status: boolean | string;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [ent, setEnt] = useState("");
  const [searching, setSearching] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: departments, isLoading: loadingDepartments } =
    useFetchDepartments();
  const { data: ents, isLoading: loadingEnts } = useFetchTeams();

  const fetchUsers = useCallback(async (filters: {
    search?: string;
    role?: string;
    department?: string;
    ent?: string;
  }) => {
    let query = supabase.from("users").select(`
      *,
      department:department_id(id, department_name , department_role)
    `);
    if (filters.search) {
      const trimmedSearch = filters.search.trim().toLowerCase();
      query = query.or(`name.ilike.%${trimmedSearch}%,recharge_id.ilike.%${trimmedSearch}%`);
    }
    if (filters.role) {
      query = query.eq("role", filters.role);
    }
    if (filters.department) {
      query = query.eq("department", filters.department);
    }
    if (filters.ent) {
      query = query.contains("ents", [filters.ent]);
    }
    const { data } = await query;
    if (data) {
      setUsers(data);
    } else {
      setUsers([]);
    }
  }, []);

  console.log(users, "users1111");

  const handleProcessClick = (user: User) => {
    setEditUser({ ...user });
    setModalOpen(true);
  };

  const handleEditChange = <K extends keyof User>(field: K, value: User[K]) => {
    if (!editUser) return;
    setEditUser({ ...editUser, [field]: value });
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        // department:
        //   typeof editUser.department === "object" &&
        //   editUser.department !== null
        //     ? editUser.department.id
        //     : editUser.department,
        ents: editUser.ents,
        active_status: editUser.active_status,
      })
      .eq("id", editUser.id);
    if (error) {
      console.error(error);
    }
    setSaving(false);
    setModalOpen(false);
    setEditUser(null);
    fetchUsers({ search, role, department, ent });
  };

  const columns = [
    { header: "Name", accessorKey: "name" },
    { header: "Email", accessorKey: "email" },
    {
      header: "Department",
      accessorKey: "department",
      cell: ({ row }: { row: { original: User } }) =>
        typeof row.original.department === "object" &&
        row.original.department !== null &&
        "department_name" in row.original.department
          ? row.original.department.department_name
          : row.original.department || "",
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: ({ row }: { row: { original: User } }) =>
        row.original.role.charAt(0).toUpperCase() + row.original.role.slice(1),
    },
    // Only show Ents column if department is support
    {
      header: "Ents",
      accessorKey: "ents",
      cell: ({ row }: { row: { original: User } }) => {
        const dep = row.original.department;
        const depName =
          typeof dep === "object" && dep !== null && "department_name" in dep
            ? dep.department_name.toLowerCase()
            : dep;
        if (depName !== "support") return "All";
        return Array.isArray(row.original.ents) && row.original.ents.length > 0
          ? row.original.ents.map((ent: string) => ent.toUpperCase()).join(", ")
          : "All";
      },
    },
    {
      header: "Status",
      accessorKey: "active_status",
      cell: ({ row }: { row: { original: User } }) =>
        row.original.active_status === true ||
        row.original.active_status === "active"
          ? "Active"
          : "Banned",
    },
    {
      header: "Action",
      accessorKey: "process",
      cell: ({ row }: { row: { original: User } }) => (
        <Button onClick={() => handleProcessClick(row.original)}>
          Process
        </Button>
      ),
    },
  ];

  useEffect(() => {
    fetchUsers({});
  }, []);

  // Real-time search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedSearch = search.trim();
      fetchUsers({ search: trimmedSearch, role, department, ent });
    }, 300); // 300ms delay to avoid too many requests

    return () => clearTimeout(timeoutId);
  }, [search, role, department, ent, fetchUsers]);

  const handleSearch = async () => {
    setSearching(true);
    await fetchUsers({ search, role, department, ent });
    setSearching(false);
  };

  // Compute filteredRoles based on selected department and departments data
  const selectedDepartmentName = department;

  const filteredRoles =
    selectedDepartmentName && departments
      ? departments
          .filter(
            (d: { department_name: string }) =>
              d.department_name === selectedDepartmentName
          )
          .map((d: { department_role: string }) => d.department_role)
          .filter((role, i, arr) => arr.indexOf(role) === i)
      : [];

  // For modal
  const modalDepartmentName =
    editUser &&
    typeof editUser.department === "object" &&
    editUser.department !== null &&
    "department_name" in editUser.department
      ? editUser.department.department_name
      : editUser?.department;

  const modalFilteredRoles =
    modalDepartmentName && departments
      ? departments
          .filter(
            (d: { department_name: string }) =>
              d.department_name === modalDepartmentName
          )
          .map((d: { department_role: string }) => d.department_role)
          .filter((role, i, arr) => arr.indexOf(role) === i)
      : [];

  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold text-neutral-100 mb-6">Users</h2>
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 bg-neutral-900/80 p-4 rounded-lg border border-neutral-800 shadow">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or recharge ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-neutral-500"
          />
        </div>
        <div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-md px-3 py-2 focus:outline-none"
          >
            <option value="">
              {department ? "Select Role" : "Select department first"}
            </option>
            {filteredRoles.map((r: string) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-md px-3 py-2 focus:outline-none"
          >
            <option value="">All Departments</option>
            {loadingDepartments ? (
              <option disabled>Loading...</option>
            ) : (
              departments?.map((d: { id: string; department_name: string }) => (
                <option key={d.id} value={d.department_name}>
                  {d.department_name.charAt(0).toUpperCase() +
                    d.department_name.slice(1)}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <select
            value={ent}
            onChange={(e) => setEnt(e.target.value)}
            className="bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-md px-3 py-2 focus:outline-none"
          >
            <option value="">All Ents</option>
            {loadingEnts ? (
              <option disabled>Loading...</option>
            ) : (
              ents
                ?.filter((e: string) => e !== "All Teams")
                .map((e: string) => (
                  <option key={e} value={e}>
                    {e.toUpperCase()}
                  </option>
                ))
            )}
          </select>
        </div>
        <Button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow focus:ring-2 focus:ring-blue-600"
          disabled={searching}
        >
          {searching ? "Searching..." : "Search"}
        </Button>
      </div>

      <SearchBar
        placeholder="Search by name or recharge ID..."
        value={search}
        onChange={setSearch}
      />

      <DynamicTable
        data={users.map((user) => ({
          ...user,
          department:
            typeof user.department === "object" &&
            user.department !== null &&
            "department_name" in user.department
              ? user.department
              : user.department || "",
          ents: user.ents || [],
          active_status: user.active_status,
        }))}
        columns={columns}
      />
      {/* Edit User Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and status.
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <form
              className="flex flex-col gap-4 mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div>
                <Label htmlFor="name">Name</Label>
                <input
                  id="name"
                  type="text"
                  value={editUser.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  className="w-full bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  className="w-full bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  value={
                    typeof editUser.department === "object" &&
                    editUser.department !== null &&
                    "department_name" in editUser.department
                      ? editUser.department.department_name
                      : editUser.department
                  }
                  onChange={(e) => {
                    const newDepartment = e.target.value;
                    // If changing from support to another department, clear ents
                    const currentDepartment =
                      typeof editUser.department === "object" &&
                      editUser.department !== null &&
                      "department_name" in editUser.department
                        ? editUser.department.department_name
                        : editUser.department;

                    if (
                      currentDepartment?.toLowerCase() === "support" &&
                      newDepartment.toLowerCase() !== "support"
                    ) {
                      handleEditChange("ents", []);
                    }
                    handleEditChange("department", newDepartment);
                  }}
                  className="w-full bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-md px-4 py-2"
                >
                  {loadingDepartments ? (
                    <option disabled>Loading...</option>
                  ) : (
                    departments?.map(
                      (d: { id: string; department_name: string }) => (
                        <option key={d.id} value={d.department_name}>
                          {d.department_name.charAt(0).toUpperCase() +
                            d.department_name.slice(1)}
                        </option>
                      )
                    )
                  )}
                </select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={editUser.role}
                  onChange={(e) => handleEditChange("role", e.target.value)}
                  className="w-full bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-md px-4 py-2"
                >
                  <option value="">
                    {modalDepartmentName
                      ? "Select Role"
                      : "Select department first"}
                  </option>
                  {modalFilteredRoles.map((r: string) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Only show Ents if department is support */}
              {(() => {
                const currentDepartment =
                  typeof editUser.department === "object" &&
                  editUser.department !== null &&
                  "department_name" in editUser.department
                    ? editUser.department.department_name
                    : editUser.department;

                return currentDepartment &&
                  currentDepartment.toLowerCase() === "support" ? (
                  <div>
                    <Label htmlFor="ents">Ents</Label>
                    <EntSelectorChips
                      value={editUser.ents || []}
                      onChange={(newEnts) => handleEditChange("ents", newEnts)}
                    />
                    <p className="text-sm text-neutral-400 mt-1">
                      Select the teams this support user can work with
                    </p>
                  </div>
                ) : null;
              })()}
              <div className="flex items-center gap-3">
                <Label htmlFor="active_status">Status</Label>
                <Switch
                  id="active_status"
                  checked={
                    editUser.active_status === true ||
                    editUser.active_status === "active"
                  }
                  onCheckedChange={(checked) =>
                    handleEditChange(
                      "active_status",
                      checked ? "active" : "banned"
                    )
                  }
                />
                <span>
                  {editUser.active_status === true ||
                  editUser.active_status === "active"
                    ? "Active"
                    : "Banned"}
                </span>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
