import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { KeyRound, Lock, Pencil, Plus, Search, Unlock } from 'lucide-react'
import { STAFF_ROLE_LABELS, canModifyStaffAccount } from '@/domain'
import {
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Skeleton,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn, isMockMode } from '@/lib/utils'
import { managerApi } from '@/services/api'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToastStore } from '@/stores/useToastStore'
import type { ApiErrorResponse, StaffDto, StaffRole } from '@/types'

const STAFF_ROLES: StaffRole[] = ['Waitstaff', 'Expediter', 'Cashier', 'Manager']

/** M4 / M4a / M4ax / M4p — Quản lý tài khoản nhân viên nội bộ và phân quyền. */
export function ManagerStaffPage() {
  useDocumentTitle('Tài khoản nhân viên')
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const pushToast = useToastStore((s) => s.push)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | StaffRole>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffDto | null>(null)
  const [resetTarget, setResetTarget] = useState<StaffDto | null>(null)
  const [credentialBanner, setCredentialBanner] = useState<{
    email: string
    username: string
    temporaryPassword?: string
    action: 'create' | 'reset'
  } | null>(null)

  const staffQuery = useQuery({
    queryKey: ['manager', 'staff'],
    queryFn: () => managerApi.getStaffList(),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, nextActive }: { id: string; nextActive: boolean }) =>
      managerApi.setStaffStatus(id, nextActive),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] })
      pushToast({
        variant: 'success',
        title: updated.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
        description: updated.fullName,
      })
    },
    onError: (err) => {
      pushToast({
        variant: 'error',
        title: 'Không thể cập nhật trạng thái',
        description: isAxiosError<ApiErrorResponse>(err)
          ? err.response?.data?.message
          : undefined,
      })
    },
  })

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (staffQuery.data ?? []).filter((s) => {
      if (roleFilter !== 'ALL' && s.role !== roleFilter) return false
      if (q) {
        const hit =
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  }, [staffQuery.data, search, roleFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            Quản lý tài khoản nhân viên
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Phân quyền và quản lý tài khoản theo 4 chức vụ: Phục vụ, Điều
            phối, Thu ngân, Quản lý
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingStaff(null)
            setFormOpen(true)
          }}
        >
          Tạo tài khoản
        </Button>
      </div>

      {credentialBanner && (
        <div
          role="status"
          data-testid="staff-credential-banner"
          className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 space-y-1.5"
        >
          <p className="text-sm font-semibold text-ink">
            {credentialBanner.action === 'create'
              ? `Đã gửi thông tin đăng nhập ban đầu đến email ${credentialBanner.email}`
              : `Đã đặt lại mật khẩu và gửi thông tin đăng nhập đến email ${credentialBanner.email}`}
          </p>
          {(isMockMode() || Boolean(import.meta.env.VITEST)) &&
            credentialBanner.temporaryPassword && (
            <p className="text-xs text-ink-muted">
              Môi trường thử nghiệm — Tài khoản{' '}
              <strong className="font-mono text-ink">
                {credentialBanner.username}
              </strong>{' '}
              · Mật khẩu tạm thời:{' '}
              <strong
                data-testid="mock-temp-password"
                className="font-mono text-accent"
              >
                {credentialBanner.temporaryPassword}
              </strong>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Danh sách tài khoản nội bộ ({filteredStaff.length} nhân viên)
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-60">
            <Input
              placeholder="Tìm tên, username, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <select
            aria-label="Lọc theo chức vụ"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'ALL' | StaffRole)}
            className="h-10 rounded-lg border border-line bg-card px-3 text-sm text-ink"
          >
            <option value="ALL">Tất cả chức vụ</option>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {STAFF_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {staffQuery.isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          title="Không tìm thấy nhân viên phù hợp"
          description="Thử xóa bộ lọc tìm kiếm hoặc tạo tài khoản mới."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-b border-line bg-card/70 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Họ và tên</th>
                  <th className="px-4 py-3">Tên đăng nhập</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Chức vụ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredStaff.map((staff) => {
                  const isSelf = currentUser?.id === staff.id
                  const isLoginLocked = Boolean(
                    staff.lockoutEnd && Date.parse(staff.lockoutEnd) > Date.now()
                  )
                  return (
                    <tr
                      key={staff.id}
                      data-testid={`staff-row-${staff.username}`}
                      className="transition-colors hover:bg-card-hover"
                    >
                      <td className="px-4 py-3.5 font-semibold text-ink">
                        {staff.fullName}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-ink-muted">
                            (Đang đăng nhập)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-ink">
                        {staff.username}
                      </td>
                      <td className="px-4 py-3.5 text-ink-muted">{staff.email}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                          {STAFF_ROLE_LABELS[staff.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            staff.isActive && !isLoginLocked
                              ? 'border-success/40 bg-success/10 text-success'
                              : 'border-danger/40 bg-danger/10 text-danger'
                          )}
                        >
                          {!staff.isActive
                            ? 'Đã khóa'
                            : isLoginLocked
                              ? 'Tạm khóa (nhập sai)'
                              : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setEditingStaff(staff)
                              setFormOpen(true)
                            }}
                          >
                            Sửa
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<KeyRound className="w-3.5 h-3.5" />}
                            onClick={() => setResetTarget(staff)}
                          >
                            Đặt lại MK
                          </Button>
                          <Button
                            type="button"
                            variant={staff.isActive ? 'danger' : 'primary'}
                            size="sm"
                            disabled={
                              isSelf &&
                              !canModifyStaffAccount({
                                actorId: currentUser?.id,
                                targetId: staff.id,
                                nextIsActive: !staff.isActive,
                              }).allowed
                            }
                            title={
                              isSelf
                                ? 'Không thể tự khóa tài khoản đang đăng nhập'
                                : undefined
                            }
                            icon={
                              staff.isActive ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5" />
                              )
                            }
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: staff.id,
                                nextActive: !staff.isActive,
                              })
                            }
                          >
                            {staff.isActive ? 'Khóa' : 'Mở khóa'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <StaffFormModal
        open={formOpen}
        staff={editingStaff}
        actorId={currentUser?.id}
        onClose={() => setFormOpen(false)}
        onCreated={(res) => {
          setFormOpen(false)
          void queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] })
          setCredentialBanner({
            email: res.email,
            username: res.username,
            temporaryPassword: res.temporaryPassword,
            action: 'create',
          })
          pushToast({
            variant: 'success',
            title: `Đã tạo tài khoản ${res.fullName}`,
          })
        }}
        onUpdated={() => {
          setFormOpen(false)
          void queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] })
          pushToast({ variant: 'success', title: 'Đã cập nhật thông tin nhân viên' })
        }}
      />

      <ResetPasswordModal
        staff={resetTarget}
        onClose={() => setResetTarget(null)}
        onReset={(staff, tempPass) => {
          setResetTarget(null)
          void queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] })
          setCredentialBanner({
            email: staff.email,
            username: staff.username,
            temporaryPassword: tempPass,
            action: 'reset',
          })
          pushToast({
            variant: 'success',
            title: `Đã đặt lại mật khẩu cho ${staff.fullName}`,
          })
        }}
      />
    </div>
  )
}

function StaffFormModal({
  open,
  staff,
  actorId,
  onClose,
  onCreated,
  onUpdated,
}: {
  open: boolean
  staff: StaffDto | null
  actorId?: string | null
  onClose: () => void
  onCreated: (res: StaffDto & { temporaryPassword?: string }) => void
  onUpdated: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [role, setRole] = useState<StaffRole>('Cashier')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [lastKey, setLastKey] = useState('')
  const key = `${open}-${staff?.id ?? 'new'}`
  if (open && key !== lastKey) {
    setLastKey(key)
    setFullName(staff?.fullName ?? '')
    setUsername(staff?.username ?? '')
    setEmail(staff?.email ?? '')
    setPhoneNumber(staff?.phoneNumber ?? '')
    setRole(staff?.role ?? 'Cashier')
    setEmailError(null)
    setUsernameError(null)
    setFormError(null)
  } else if (!open && lastKey) {
    setLastKey('')
  }

  const selfRoleBlocked =
    Boolean(staff) &&
    !canModifyStaffAccount({
      actorId,
      targetId: staff!.id,
      nextRole: role,
    }).allowed

  const mutation = useMutation({
    mutationFn: () => {
      if (staff) {
        return managerApi.updateStaff(staff.id, {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim(),
          role,
        })
      }
      return managerApi.createStaff({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        username: username.trim(),
        email: email.trim(),
        role,
      })
    },
    onSuccess: (res) => {
      if (staff) {
        onUpdated()
      } else {
        onCreated(res)
      }
    },
    onError: (err) => {
      const msg = isAxiosError<ApiErrorResponse>(err)
        ? (err.response?.data?.message ?? 'Không thể lưu tài khoản')
        : 'Không thể lưu tài khoản'
      if (msg.toLowerCase().includes('email')) {
        setEmailError(msg)
      } else if (msg.toLowerCase().includes('đăng nhập')) {
        setUsernameError(msg)
      } else {
        setFormError(msg)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setUsernameError(null)
    setFormError(null)
    if (!fullName.trim() || !email.trim() || (!staff && !username.trim())) {
      setFormError('Vui lòng điền đầy đủ họ tên, tên đăng nhập và email')
      return
    }
    if (selfRoleBlocked) {
      setFormError('Không thể tự hạ quyền tài khoản Quản lý đang đăng nhập')
      return
    }
    mutation.mutate()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={staff ? `Sửa tài khoản · ${staff.fullName}` : 'Tạo tài khoản nhân viên'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Họ và tên"
          placeholder="Ví dụ: Nguyễn Minh Tâm"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Tên đăng nhập"
            placeholder="tam.nm"
            disabled={Boolean(staff)}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={usernameError ?? undefined}
          />
          <Input
            label="Email"
            type="email"
            placeholder="tam.nm@vindining.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError ?? undefined}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Số điện thoại"
            placeholder="0901234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <div className="space-y-1.5">
            <label
              htmlFor="staff-role-select"
              className="block text-xs font-medium text-ink-muted"
            >
              Chức vụ
            </label>
            <select
              id="staff-role-select"
              value={role}
              disabled={Boolean(staff && actorId === staff.id)}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink disabled:opacity-60"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {STAFF_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            {staff && actorId === staff.id && (
              <p className="text-[11px] text-ink-muted">
                Không thể tự hạ quyền tài khoản đang đăng nhập.
              </p>
            )}
          </div>
        </div>

        {formError && (
          <p role="alert" className="text-xs text-danger">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={mutation.isPending}
          >
            {staff ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ResetPasswordModal({
  staff,
  onClose,
  onReset,
}: {
  staff: StaffDto | null
  onClose: () => void
  onReset: (staff: StaffDto, temporaryPassword?: string) => void
}) {
  const mutation = useMutation({
    mutationFn: () => managerApi.resetStaffPassword(staff!.id),
    onSuccess: (res) => {
      if (staff) onReset(staff, res.temporaryPassword)
    },
  })

  return (
    <Modal
      open={Boolean(staff)}
      onClose={onClose}
      title="Đặt lại mật khẩu nhân viên"
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Xác nhận đặt lại mật khẩu
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">
        Khởi tạo mật khẩu mới và gửi thông tin đăng nhập đến email{' '}
        <strong className="text-ink">{staff?.email}</strong> cho nhân viên{' '}
        <strong className="text-ink">{staff?.fullName}</strong>?
      </p>
    </Modal>
  )
}
