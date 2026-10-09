import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { Tabs, type TabItem } from '@/components/navigation/Tabs'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { Input } from '@/components/forms/Input'
import { useToast } from '@/app/providers'
import type { UserRead, RoleRead, PermissionRead, UserCreate } from '@/types/api'

export const AdminPage: React.FC = () => {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('users')
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [submittingUser, setSubmittingUser] = useState(false)

  const [userData, setUserData] = useState<UserCreate>({
    email: '',
    full_name: '',
    phone: '',
    password: '',
  })

  // Queries
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.listUsers(),
  })

  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => adminApi.listRoles(),
  })

  const permissionsQuery = useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: () => adminApi.listPermissions(),
  })

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingUser(true)
    try {
      await adminApi.createUser(userData)
      toast.success('User Provisioned', `Created account for ${userData.full_name}`)
      setIsCreateUserOpen(false)
      setUserData({ email: '', full_name: '', phone: '', password: '' })
      usersQuery.refetch()
    } catch (err: unknown) {
      toast.error('Provisioning Failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmittingUser(false)
    }
  }

  // --- Users Columns ---
  const userColumns: Column<UserRead>[] = [
    {
      key: 'full_name',
      header: 'Staff Member',
      render: (u) => (
        <div>
          <span className="font-semibold text-xs text-[#1C1A17] block">{u.full_name}</span>
          <span className="text-[11px] font-mono text-[#5A5347]">{u.email}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (u) => (
        <span className="text-xs text-[#5A5347]">
          {u.phone || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (u) => <StatusBadge status={u.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'id',
      header: 'User Identifier',
      render: (u) => (
        <span className="text-[11px] font-mono text-[#726B5C]">
          {u.id}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Provisioned',
      render: (u) => (
        <span className="text-xs text-[#5A5347] font-mono">
          {u.created_at?.slice(0, 10)}
        </span>
      ),
      sortable: true,
    },
  ]

  // --- Roles Columns ---
  const roleColumns: Column<RoleRead>[] = [
    {
      key: 'name',
      header: 'Role Title',
      render: (r) => (
        <span className="font-mono text-xs font-bold text-[#7A2A12]">
          {r.name}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'description',
      header: 'Scope of Responsibilities',
      render: (r) => (
        <span className="text-xs text-[#5A5347]">{r.description || '—'}</span>
      ),
    },
  ]

  // --- Permissions Columns ---
  const permColumns: Column<PermissionRead>[] = [
    {
      key: 'codename',
      header: 'Permission Codename',
      render: (p) => (
        <span className="font-mono text-xs font-bold text-[#1C1A17]">
          {p.codename}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'resource',
      header: 'Domain Resource',
      render: (p) => (
        <span className="text-xs px-2 py-0.5 rounded-xs bg-[#F8F6F2] border border-[#E4DED3] text-[#5A5347] font-mono">
          {p.resource}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'description',
      header: 'Policy Statement',
      render: (p) => (
        <span className="text-xs text-[#5A5347]">{p.description || '—'}</span>
      ),
    },
  ]

  const tabs: TabItem[] = [
    { id: 'users', label: `Users (${usersQuery.data?.length ?? 0})` },
    { id: 'roles', label: `Roles (${rolesQuery.data?.length ?? 0})` },
    { id: 'permissions', label: `Permissions (${permissionsQuery.data?.length ?? 0})` },
  ]

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Access Control &amp; Institutional Governance"
        subtitle="Role-based access control (RBAC), multi-tenant provisioning, and platform security administration"
        actions={
          activeTab === 'users' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateUserOpen(true)}
              leftIcon={<Icon name="userPlus" size="xs" />}
            >
              Provision User
            </Button>
          )
        }
      />

      <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'users' && (
        <DataTable
          data={usersQuery.data || []}
          columns={userColumns}
          isLoading={usersQuery.isLoading}
          searchPlaceholder="Search staff by name, email, or role..."
          emptyMessage="No user accounts registered."
        />
      )}

      {activeTab === 'roles' && (
        <DataTable
          data={rolesQuery.data || []}
          columns={roleColumns}
          isLoading={rolesQuery.isLoading}
          searchPlaceholder="Search roles..."
          emptyMessage="No clinical roles configured."
        />
      )}

      {activeTab === 'permissions' && (
        <DataTable
          data={permissionsQuery.data || []}
          columns={permColumns}
          isLoading={permissionsQuery.isLoading}
          searchPlaceholder="Search permission codenames or resources..."
          emptyMessage="No system permissions configured."
        />
      )}

      {/* Modal: Provision User */}
      <Dialog open={isCreateUserOpen} onClose={() => setIsCreateUserOpen(false)} size="md">
        <DialogHeader
          title="Provision Institutional User Account"
          description="Create a certified user account for investigators, monitors, or trial administrators."
        />
        <form onSubmit={handleCreateUser}>
          <DialogContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Full Name *
              </label>
              <Input
                required
                placeholder="Dr. Rajesh Sharma"
                value={userData.full_name}
                onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Institutional Email *
              </label>
              <Input
                type="email"
                required
                placeholder="investigator@hospital.aiia.in"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Contact Phone
              </label>
              <Input
                placeholder="+91 98110 12345"
                value={userData.phone || ''}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Initial Password *
              </label>
              <Input
                type="password"
                required
                placeholder="Minimum 8 characters with bcrypt salt..."
                value={userData.password}
                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsCreateUserOpen(false)}
              disabled={submittingUser}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submittingUser}>
              Provision Account
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </PageContainer>
  )
}
