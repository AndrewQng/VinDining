import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  COURSE_TYPE_LABELS,
  formatVnd,
  validateTastingMenuSelection,
} from '@/domain'
import {
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Money,
  Skeleton,
  Tabs,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { managerApi, menuApi } from '@/services/api'
import { useToastStore } from '@/stores/useToastStore'
import type {
  ApiErrorResponse,
  CourseType,
  MenuItemDto,
  TastingMenuDto,
  TastingMenuItemInput,
} from '@/types'

type MenuTab = 'items' | 'sets'
type CourseFilter = 'ALL' | CourseType

const COURSE_OPTIONS: CourseType[] = [
  'Appetizer',
  'MainCourse',
  'Dessert',
  'Beverage',
]

const COURSE_FILTER_OPTIONS: ReadonlyArray<{ value: CourseFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả nhóm' },
  { value: 'Appetizer', label: COURSE_TYPE_LABELS.Appetizer },
  { value: 'MainCourse', label: COURSE_TYPE_LABELS.MainCourse },
  { value: 'Dessert', label: COURSE_TYPE_LABELS.Dessert },
  { value: 'Beverage', label: COURSE_TYPE_LABELS.Beverage },
]

/** M1 / M1a / M1ax / M1s — Quản lý thực đơn món lẻ & Set Menu. */
export function ManagerMenuPage() {
  useDocumentTitle('Quản lý thực đơn')
  const queryClient = useQueryClient()
  const pushToast = useToastStore((s) => s.push)
  const [tab, setTab] = useState<MenuTab>('items')
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('ALL')

  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItemDto | null>(null)
  const [deleteItemTarget, setDeleteItemTarget] = useState<MenuItemDto | null>(
    null
  )

  const [setModalOpen, setSetModalOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<TastingMenuDto | null>(null)
  const [deleteSetTarget, setDeleteSetTarget] = useState<TastingMenuDto | null>(
    null
  )

  const itemsQuery = useQuery({
    queryKey: ['manager', 'menu-items'],
    queryFn: () => managerApi.getMenuItems(),
  })

  const categoriesQuery = useQuery({
    queryKey: ['public-menu-categories'],
    queryFn: () => menuApi.getCategories(),
  })

  const setsQuery = useQuery({
    queryKey: ['manager', 'tasting-menus'],
    queryFn: () => managerApi.getTastingMenus(),
  })

  const invalidateMenuQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ['manager', 'menu-items'] })
    void queryClient.invalidateQueries({
      queryKey: ['manager', 'tasting-menus'],
    })
    void queryClient.invalidateQueries({ queryKey: ['menu-items'] })
    void queryClient.invalidateQueries({ queryKey: ['public-tasting-menus'] })
    void queryClient.invalidateQueries({ queryKey: ['public-menu-categories'] })
  }

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      managerApi.setMenuItemAvailability(id, available ? 'Available' : 'SoldOut'),
    onSuccess: (updated) => {
      invalidateMenuQueries()
      pushToast({
        variant: 'success',
        title: updated.status === 'Available' ? 'Đã bật Còn món' : 'Đã chuyển Tạm hết',
        description: updated.name,
      })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => managerApi.deleteMenuItem(id),
    onSuccess: () => {
      setDeleteItemTarget(null)
      invalidateMenuQueries()
      pushToast({ variant: 'success', title: 'Đã xóa món khỏi thực đơn' })
    },
  })

  const deleteSetMutation = useMutation({
    mutationFn: (id: string) => managerApi.deleteTastingMenu(id),
    onSuccess: () => {
      setDeleteSetTarget(null)
      invalidateMenuQueries()
      pushToast({ variant: 'success', title: 'Đã xóa Set Menu' })
    },
  })

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (itemsQuery.data ?? []).filter((item) => {
      if (courseFilter !== 'ALL' && item.courseType !== courseFilter) {
        return false
      }
      if (q && !item.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [itemsQuery.data, search, courseFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            Quản lý thực đơn
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'items' ? (
            <Button
              type="button"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingItem(null)
                setItemModalOpen(true)
              }}
            >
              Thêm món mới
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingSet(null)
                setSetModalOpen(true)
              }}
            >
              Tạo Set Menu
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'items', label: `Món lẻ (${itemsQuery.data?.length ?? 0})` },
            { value: 'sets', label: `Set Menu (${setsQuery.data?.length ?? 0})` },
          ]}
        />

        {tab === 'items' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-60">
                <Input
                  placeholder="Tìm tên món ăn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
            </div>
            <select
              aria-label="Lọc theo nhóm món"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value as CourseFilter)}
              className="h-10 rounded-lg border border-line bg-card px-3 text-sm text-ink"
            >
              {COURSE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {tab === 'items' ? (
        itemsQuery.isLoading ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Không có món ăn phù hợp"
            description="Thử thay đổi bộ lọc hoặc thêm món ăn mới vào thực đơn."
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-line bg-card/70 text-xs font-semibold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Tên món</th>
                    <th className="px-4 py-3">Nhóm</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3">Định mức (Prep SLA)</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredItems.map((item) => {
                    const isAvailable = item.status === 'Available'
                    return (
                      <tr
                        key={item.id}
                        data-testid={`menu-item-row-${item.id}`}
                        className="transition-colors hover:bg-card-hover"
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-ink">{item.name}</p>
                          {item.description && (
                            <p className="mt-0.5 text-xs text-ink-muted">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-medium text-ink">
                            {COURSE_TYPE_LABELS[item.courseType]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-accent tabular-nums">
                          <Money amount={item.price} />
                        </td>
                        <td className="px-4 py-3.5 text-ink-muted tabular-nums">
                          {item.prepTimeMinutes > 0
                            ? `${item.prepTimeMinutes} phút`
                            : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isAvailable}
                            aria-label={`Trạng thái ${item.name}`}
                            onClick={() =>
                              toggleAvailabilityMutation.mutate({
                                id: item.id,
                                available: !isAvailable,
                              })
                            }
                            className={cn(
                              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer',
                              isAvailable
                                ? 'border-success/50 bg-success/10 text-success'
                                : 'border-danger/50 bg-danger/10 text-danger'
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                'h-2 w-2 rounded-full',
                                isAvailable ? 'bg-success' : 'bg-danger'
                              )}
                            />
                            {isAvailable ? 'Còn món' : 'Tạm hết'}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              icon={<Pencil className="w-3.5 h-3.5" />}
                              onClick={() => {
                                setEditingItem(item)
                                setItemModalOpen(true)
                              }}
                            >
                              Sửa
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                              onClick={() => setDeleteItemTarget(item)}
                            >
                              Xóa
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
        )
      ) : setsQuery.isLoading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (setsQuery.data ?? []).length === 0 ? (
        <EmptyState
          title="Chưa có Set Menu nào"
          description="Tạo Set Menu gồm đủ Khai vị, Món chính và Tráng miệng."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(setsQuery.data ?? []).map((setMenu) => (
            <Card
              key={setMenu.id}
              data-testid={`set-menu-card-${setMenu.id}`}
              className="grid grid-rows-[auto_1fr] md:row-span-2 md:grid-rows-[subgrid] gap-y-4 h-full"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="font-serif text-lg font-bold text-ink line-clamp-2 min-h-[1.75rem]">
                    {setMenu.name}
                  </h2>
                  <p className="text-sm font-semibold text-accent tabular-nums">
                    Giá trọn gói: {formatVnd(setMenu.price)} / khách
                  </p>
                  <p className="text-xs text-ink-muted line-clamp-2 min-h-[2rem]">
                    {setMenu.description ?? ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingSet(setMenu)
                      setSetModalOpen(true)
                    }}
                  >
                    Sửa Set
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteSetTarget(setMenu)}
                  >
                    Xóa
                  </Button>
                </div>
              </div>

              <div className="space-y-2 self-end">
                {setMenu.items.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm"
                  >
                    <span className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent shrink-0">
                      {COURSE_TYPE_LABELS[course.courseType]}
                    </span>
                    <span className="font-semibold text-ink truncate">
                      {course.menuItemName}
                    </span>
                    <span className="text-xs text-ink-muted ml-auto tabular-nums">
                      (Prep: {course.prepTimeMinutes} phút)
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <MenuItemFormModal
        open={itemModalOpen}
        item={editingItem}
        categories={categoriesQuery.data ?? []}
        onClose={() => setItemModalOpen(false)}
        onSaved={() => {
          setItemModalOpen(false)
          invalidateMenuQueries()
          pushToast({
            variant: 'success',
            title: editingItem ? 'Đã cập nhật món ăn' : 'Đã thêm món ăn mới',
          })
        }}
      />

      <SetMenuFormModal
        open={setModalOpen}
        setMenu={editingSet}
        menuItems={itemsQuery.data ?? []}
        onClose={() => setSetModalOpen(false)}
        onSaved={() => {
          setSetModalOpen(false)
          invalidateMenuQueries()
          pushToast({
            variant: 'success',
            title: editingSet ? 'Đã cập nhật Set Menu' : 'Đã tạo Set Menu mới',
          })
        }}
      />

      <Modal
        open={Boolean(deleteItemTarget)}
        onClose={() => setDeleteItemTarget(null)}
        title="Xác nhận xóa món"
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteItemTarget(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteItemMutation.isPending}
              onClick={() => {
                if (deleteItemTarget) {
                  deleteItemMutation.mutate(deleteItemTarget.id)
                }
              }}
            >
              Xác nhận xóa
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Xóa món <strong className="text-ink">{deleteItemTarget?.name}</strong>{' '}
          khỏi thực đơn phục vụ?
        </p>
      </Modal>

      <Modal
        open={Boolean(deleteSetTarget)}
        onClose={() => setDeleteSetTarget(null)}
        title="Xác nhận xóa Set Menu"
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteSetTarget(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteSetMutation.isPending}
              onClick={() => {
                if (deleteSetTarget) {
                  deleteSetMutation.mutate(deleteSetTarget.id)
                }
              }}
            >
              Xác nhận xóa
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Xóa gói <strong className="text-ink">{deleteSetTarget?.name}</strong>{' '}
          khỏi hệ thống?
        </p>
      </Modal>
    </div>
  )
}

function MenuItemFormModal({
  open,
  item,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean
  item: MenuItemDto | null
  categories: { id: string; courseType: CourseType }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [courseType, setCourseType] = useState<CourseType>('Appetizer')
  const [prepTime, setPrepTime] = useState('15')
  const [nameError, setNameError] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const syncFromProp = () => {
    setName(item?.name ?? '')
    setDescription(item?.description ?? '')
    setPrice(item ? String(item.price) : '')
    setCourseType(item?.courseType ?? 'Appetizer')
    setPrepTime(item ? String(item.prepTimeMinutes) : '15')
    setNameError(null)
    setPriceError(null)
    setFormError(null)
  }

  const [lastOpenKey, setLastOpenKey] = useState('')
  const currentKey = `${open}-${item?.id ?? 'new'}`
  if (open && currentKey !== lastOpenKey) {
    setLastOpenKey(currentKey)
    syncFromProp()
  } else if (!open && lastOpenKey) {
    setLastOpenKey('')
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const parsedPrice = Number(price)
      const parsedPrep = Math.max(0, Math.round(Number(prepTime) || 0))
      const matchedCat =
        categories.find((c) => c.courseType === courseType)?.id ??
        categories[0]?.id ??
        'cat-appetizer'
      if (item) {
        return managerApi.updateMenuItem(item.id, {
          categoryId: matchedCat,
          name: name.trim(),
          description: description.trim() || null,
          price: parsedPrice,
          prepTimeMinutes: parsedPrep,
          courseType,
        })
      }
      return managerApi.createMenuItem({
        categoryId: matchedCat,
        name: name.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        prepTimeMinutes: parsedPrep,
        courseType,
      })
    },
    onSuccess: onSaved,
    onError: (err) => {
      const msg = isAxiosError<ApiErrorResponse>(err)
        ? (err.response?.data?.message ?? 'Không thể lưu món ăn')
        : 'Không thể lưu món ăn'
      if (msg.toLowerCase().includes('tên món')) {
        setNameError(msg)
      } else if (msg.toLowerCase().includes('đơn giá')) {
        setPriceError(msg)
      } else {
        setFormError(msg)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNameError(null)
    setPriceError(null)
    setFormError(null)
    if (!name.trim()) {
      setNameError('Vui lòng nhập tên món ăn')
      return
    }
    const parsedPrice = Number(price)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setPriceError('Đơn giá phải lớn hơn 0 ₫')
      return
    }
    mutation.mutate()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Sửa món · ${item.name}` : 'Thêm món mới'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên món"
          placeholder="Ví dụ: Sò điệp Hokkaido nướng bơ tỏi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError ?? undefined}
        />

        <Input
          label="Mô tả ngắn"
          placeholder="Mô tả hương vị hoặc cách chế biến"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Đơn giá (VNĐ)"
            type="number"
            min={1000}
            step={1000}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={priceError ?? undefined}
          />

          <div className="space-y-1.5">
            <label
              htmlFor="menu-course-select"
              className="block text-xs font-medium text-ink-muted"
            >
              Nhóm món
            </label>
            <select
              id="menu-course-select"
              value={courseType}
              onChange={(e) => setCourseType(e.target.value as CourseType)}
              className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink"
            >
              {COURSE_OPTIONS.map((ct) => (
                <option key={ct} value={ct}>
                  {COURSE_TYPE_LABELS[ct]}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Prep SLA (phút)"
            type="number"
            min={0}
            max={120}
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
          />
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
            {item ? 'Lưu thay đổi' : 'Lưu món mới'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function SetMenuFormModal({
  open,
  setMenu,
  menuItems,
  onClose,
  onSaved,
}: {
  open: boolean
  setMenu: TastingMenuDto | null
  menuItems: MenuItemDto[]
  onClose: () => void
  onSaved: () => void
}) {
  const appetizers = useMemo(
    () => menuItems.filter((m) => m.courseType === 'Appetizer'),
    [menuItems]
  )
  const mains = useMemo(
    () => menuItems.filter((m) => m.courseType === 'MainCourse'),
    [menuItems]
  )
  const desserts = useMemo(
    () => menuItems.filter((m) => m.courseType === 'Dessert'),
    [menuItems]
  )

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [appetizerId, setAppetizerId] = useState('')
  const [mainId, setMainId] = useState('')
  const [dessertId, setDessertId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [lastKey, setLastKey] = useState('')
  const key = `${open}-${setMenu?.id ?? 'new'}`
  if (open && key !== lastKey) {
    setLastKey(key)
    setName(setMenu?.name ?? '')
    setDescription(setMenu?.description ?? '')
    setPrice(setMenu ? String(setMenu.price) : '1500000')
    setAppetizerId(
      setMenu?.items.find((i) => i.courseType === 'Appetizer')?.menuItemId ??
        appetizers[0]?.id ??
        ''
    )
    setMainId(
      setMenu?.items.find((i) => i.courseType === 'MainCourse')?.menuItemId ??
        mains[0]?.id ??
        ''
    )
    setDessertId(
      setMenu?.items.find((i) => i.courseType === 'Dessert')?.menuItemId ??
        desserts[0]?.id ??
        ''
    )
    setError(null)
  } else if (!open && lastKey) {
    setLastKey('')
  } else if (open) {
    if (!appetizerId && appetizers[0]) setAppetizerId(appetizers[0].id)
    if (!mainId && mains[0]) setMainId(mains[0].id)
    if (!dessertId && desserts[0]) setDessertId(desserts[0].id)
  }

  const mutation = useMutation({
    mutationFn: (items: TastingMenuItemInput[]) => {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: Math.round(Number(price)),
        isActive: true,
        items,
      }
      return setMenu
        ? managerApi.updateTastingMenu(setMenu.id, payload)
        : managerApi.createTastingMenu(payload)
    },
    onSuccess: onSaved,
    onError: (err) => {
      setError(
        isAxiosError<ApiErrorResponse>(err)
          ? (err.response?.data?.message ?? 'Không thể lưu Set Menu')
          : 'Không thể lưu Set Menu'
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || Number(price) <= 0) {
      setError('Vui lòng nhập tên Set Menu và giá trọn gói hợp lệ')
      return
    }
    const items: TastingMenuItemInput[] = [
      { menuItemId: appetizerId, courseOrder: 1, courseType: 'Appetizer' },
      { menuItemId: mainId, courseOrder: 2, courseType: 'MainCourse' },
      { menuItemId: dessertId, courseOrder: 3, courseType: 'Dessert' },
    ]
    const validation = validateTastingMenuSelection(items)
    if (!validation.valid) {
      setError(Object.values(validation.errors)[0] ?? 'Vui lòng chọn đủ 3 món')
      return
    }
    mutation.mutate(items)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={setMenu ? `Sửa Set Menu · ${setMenu.name}` : 'Tạo Set Menu'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên Set Menu"
          placeholder="Ví dụ: Set Menu Hoàng Gia"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Giá trọn gói / khách (VNĐ)"
            type="number"
            min={1000}
            step={1000}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            label="Mô tả ngắn"
            placeholder="Trải nghiệm 3 món chọn lọc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-line bg-card p-3.5">
          <p className="text-xs font-semibold text-accent">
            Chọn đúng 1 món cho mỗi Course
          </p>

          <div className="space-y-1">
            <label
              htmlFor="set-appetizer"
              className="block text-xs font-medium text-ink-muted"
            >
              Món Khai vị
            </label>
            <select
              id="set-appetizer"
              value={appetizerId}
              onChange={(e) => setAppetizerId(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
            >
              {appetizers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({formatVnd(d.price)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="set-main"
              className="block text-xs font-medium text-ink-muted"
            >
              Món chính
            </label>
            <select
              id="set-main"
              value={mainId}
              onChange={(e) => setMainId(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
            >
              {mains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({formatVnd(d.price)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="set-dessert"
              className="block text-xs font-medium text-ink-muted"
            >
              Tráng miệng
            </label>
            <select
              id="set-dessert"
              value={dessertId}
              onChange={(e) => setDessertId(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
            >
              {desserts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({formatVnd(d.price)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
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
            {setMenu ? 'Lưu Set Menu' : 'Tạo Set Menu'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
