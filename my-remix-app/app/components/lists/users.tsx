import { useEffect, useState } from "react";
import { supabase } from "~/hooks/use-auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  ents: string[];
}

const ROLES = ["admin", "executive", "manager", "user"];
const DEPARTMENTS = [
  "finance",
  "support",
  "verification",
  "operation",
  "admin",
];
const ENTS = ["ent1", "ent2", "ent3"];

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [ent, setEnt] = useState("");
  const [searching, setSearching] = useState(false);

  const fetchUsers = async (filters = {}) => {
    setLoading(true);
    let query = supabase.from("users").select();
    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
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
    const { data, error } = await query;
    if (!error && data) {
      setUsers(data);
    } else {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = async () => {
    setSearching(true);
    await fetchUsers({ search, role, department, ent });
    setSearching(false);
  };

  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold text-neutral-100 mb-6">Users</h2>
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 bg-neutral-900/80 p-4 rounded-lg border border-neutral-800 shadow">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name..."
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
            <option value="">All Roles</option>
            {ROLES.map((r) => (
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
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={ent}
            onChange={(e) => setEnt(e.target.value)}
            className="bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-md px-3 py-2 focus:outline-none"
          >
            <option value="">All Ents</option>
            {ENTS.map((e) => (
              <option key={e} value={e}>
                {e.toUpperCase()}
              </option>
            ))}
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
      <ScrollArea className="h-[60vh] rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-neutral-800 border-neutral-700">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-2">
                    <Skeleton className="h-5 w-20 rounded" />
                    <Skeleton className="h-5 w-24 rounded" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Skeleton className="h-5 w-12 rounded" />
                    <Skeleton className="h-5 w-12 rounded" />
                    <Skeleton className="h-5 w-12 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : users.length === 0 ? (
            <div className="text-neutral-400 text-center col-span-2">
              No users found.
            </div>
          ) : (
            users.map((user) => (
              <Card
                key={user.id}
                className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border border-neutral-700 hover:border-blue-600 hover:shadow-2xl transition-all duration-200 shadow-lg group relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 bg-blue-600 pointer-events-none" />
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-blue-800 text-blue-100">
                      {user.name
                        ? user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-neutral-100 text-lg">
                      {user.name || "No Name"}
                    </CardTitle>
                    <CardDescription className="text-neutral-400 text-sm">
                      {user.email}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-700/80 text-blue-100 border-none"
                    >
                      {user.role}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-blue-700 text-blue-300"
                    >
                      {user.department}
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Array.isArray(user.ents) && user.ents.length > 0 ? (
                      user.ents.map((ent) => (
                        <Badge
                          key={ent}
                          variant="default"
                          className="bg-neutral-700 text-neutral-100"
                        >
                          {ent}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-neutral-500 text-xs">No ents</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
