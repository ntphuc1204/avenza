"use client";

import RolesTable from '@/components/admin/roles/roles.table';
import AdminLayout from '@/components/layout/admin.layout';

const RolesPage = () => {
  return (
    <AdminLayout>
      <h2>Quản lý Roles</h2>
      <RolesTable />
    </AdminLayout>
  );
};

export default RolesPage;
