import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DynamicTable } from '../components/shared/DynamicTable';

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export default function TestTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 3; // items per page

  useEffect(() => {
    fetch(`https://jsonplaceholder.typicode.com/users?_page=${pageIndex + 1}&_limit=${limit}`)
      .then(res => res.json())
      .then(data => setUsers(data));
  }, [pageIndex]);

  const columns: ColumnDef<User>[] = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
  ];

  return (
    <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
      <h2>Test User Table</h2>
      <DynamicTable
        columns={columns}
        data={users}
        pagination
        pageIndex={pageIndex}
        pageCount={4} // There are 10 users, 3 per page => 4 pages
        limit={limit}
        onPageChange={(newPage) => setPageIndex(newPage)}
      />
    </div>
  );
}
