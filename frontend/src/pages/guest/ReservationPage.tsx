import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  Sparkles,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  RotateCcw,
  QrCode,
} from 'lucide-react'
import type { DiningShift } from '@/types/reservation'
import type { TableZone } from '@/types/table'
import { useAvailableTables, useCreateReservation, useConfirmDeposit } from '@/hooks/useReservations'
import { useSeedSampleData } from '@/hooks/useTestingData'
import { Button, Badge, Card } from '@/components/ui'
import type { CreateReservationResultDto } from '@/types'

export function ReservationPage() {
  const [partySize, setPartySize] = useState(2)
  const [shift, setShift] = useState<DiningShift>('Dinner')
  const [zone, setZone] = useState<TableZone>('MainHall')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [time, setTime] = useState('18:30')
  const [guestName, setGuestName] = useState('Lê Hoàng Thực Khách')
  const [guestPhone, setGuestPhone] = useState('0909999888')
  const [guestEmail, setGuestEmail] = useState('guest@vindining.vn')
  const [specialRequests, setSpecialRequests] = useState('Bàn gần cửa sổ, kỷ niệm ngày cưới')
  
  const [bookingResult, setBookingResult] = useState<CreateReservationResultDto | null>(null)
  const [depositConfirmed, setDepositConfirmed] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fine Dining Deposit: 500,000 VND per guest
  const depositPerGuest = 500000
  const totalDeposit = partySize * depositPerGuest

  const zoneMap: Record<TableZone, number> = {
    MainHall: 0,
    VIP: 1,
    Balcony: 2,
    Terrace: 0,
  }

  const reservationDateTimeIso = new Date(`${date}T${time}:00`).toISOString()

  // Queries & Mutations
  const {
    data: availableTables,
    isLoading: isLoadingTables,
    refetch: refetchTables,
  } = useAvailableTables({
    reservationTime: reservationDateTimeIso,
    partySize,
    zone: zoneMap[zone],
    enabled: true,
  })

  const createReservationMutation = useCreateReservation()
  const confirmDepositMutation = useConfirmDeposit()
  const seedSampleDataMutation = useSeedSampleData()

  // Auto-select first available table when loaded
  useEffect(() => {
    if (availableTables && availableTables.length > 0) {
      if (!selectedTableId || !availableTables.some((t) => t.id === selectedTableId)) {
        setSelectedTableId(availableTables[0].id)
      }
    }
  }, [availableTables, selectedTableId])

  const zones: { id: TableZone; name: string; desc: string }[] = [
    { id: 'MainHall', name: 'Đại Sảnh (Main Hall)', desc: 'Không gian mở thanh lịch, ánh nến lung linh' },
    { id: 'VIP', name: 'Phòng VIP Riêng Tư', desc: 'Không gian biệt lập dành cho tiệc riêng tư và đối tác' },
    { id: 'Balcony', name: 'Ban Công (Balcony)', desc: 'Tầm nhìn thoáng đãng ngắm trọn cảnh quan đêm' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!selectedTableId) {
      setErrorMessage('Vui lòng chọn bàn ăn khả dụng trước khi xác nhận đặt chỗ.')
      return
    }

    try {
      const result = await createReservationMutation.mutateAsync({
        fullName: guestName,
        phoneNumber: guestPhone,
        email: guestEmail,
        tableId: selectedTableId,
        reservationTime: reservationDateTimeIso,
        partySize,
        note: specialRequests,
      })

      setBookingResult(result)
      setDepositConfirmed(false)
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      setErrorMessage(
        errorObj.response?.data?.message ||
          'Không thể hoàn tất đặt bàn. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.'
      )
    }
  }

  const handleConfirmDepositDemo = async () => {
    if (!bookingResult) return
    try {
      await confirmDepositMutation.mutateAsync({
        bookingCode: bookingResult.bookingCode,
        transactionId: `VNPAY-DEMO-${Date.now().toString().slice(-6)}`,
        paymentMethod: 2, // BankTransfer
      })
      setDepositConfirmed(true)
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      alert(errorObj.response?.data?.message || 'Lỗi xác nhận tiền cọc')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-300 border border-gold-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Trải Nghiệm Ẩm Thực Tinh Hoa</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-100 tracking-tight">
          Đặt Bàn Trực Tuyến & Cọc Giữ Chỗ
        </h1>
        <p className="text-sm text-neutral-400 mt-2 max-w-lg mx-auto">
          Khoản tiền cọc được cấn trừ trực tiếp 100% vào hóa đơn thanh toán khi dùng bữa tại nhà hàng.
        </p>
      </div>

      {bookingResult ? (
        <Card className="max-w-lg mx-auto p-8 text-center shadow-2xl border-gold-500/30">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-100 mb-1">Đăng Ký Đặt Bàn Thành Công</h2>
          <p className="text-xs text-neutral-400 mb-4">
            Mã phiên đặt chỗ cho quý khách <strong className="text-gold-300">{guestName}</strong> ({partySize} khách).
          </p>

          <div className="rounded-xl bg-dark-card border border-dark-border p-4 text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Mã đặt bàn (Booking Code):</span>
              <span className="font-mono font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20 text-sm">
                {bookingResult.bookingCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Bàn được phân bổ:</span>
              <span className="font-semibold text-neutral-200">Bàn {bookingResult.tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Thời gian hẹn:</span>
              <span className="font-semibold text-neutral-200">{date} lúc {time}</span>
            </div>
            <div className="flex justify-between border-t border-dark-border pt-2">
              <span className="text-neutral-400">Khoản tiền cọc giữ chỗ:</span>
              <span className="font-bold text-gold-400 font-mono text-sm">
                {bookingResult.depositAmount.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>

          {depositConfirmed ? (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Tiền cọc đã được thanh toán thành công! Bàn đã chuyển sang trạng thái <strong>Reserved</strong>.</span>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Bàn đang được tạm khóa giữ chỗ (LockedForPayment). Vui lòng thanh toán cọc trong 15 phút.</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={bookingResult.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Cổng VNPAY / QR Code</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <Button
                  onClick={handleConfirmDepositDemo}
                  loading={confirmDepositMutation.isPending}
                  variant="outline"
                  className="flex-1 py-2.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  <span>Xác Nhận Cọc (Demo)</span>
                </Button>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-dark-border flex justify-between items-center text-xs">
            <button
              onClick={() => {
                setBookingResult(null)
                setDepositConfirmed(false)
              }}
              className="cursor-pointer text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tạo Lịch Đặt Mới</span>
            </button>

            <a
              href="/floor-plan"
              className="text-gold-400 hover:underline flex items-center gap-1"
            >
              <span>Xem Sơ Đồ Bàn</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Booking Options */}
          <div className="md:col-span-2 space-y-6">
            {/* Step 1: Party Size & Shift */}
            <div className="rounded-2xl border border-dark-border bg-dark-surface/80 p-6">
              <h2 className="text-sm font-bold text-gold-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>1. Số Lượng Khách & Ca Phục Vụ</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-2">Số lượng khách dùng bữa</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 4, 6, 8, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPartySize(num)}
                        className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          partySize === num
                            ? 'bg-gold-500 text-neutral-950 border-gold-400 shadow-md'
                            : 'bg-dark-card border-dark-border text-neutral-300 hover:border-gold-500/40'
                        }`}
                      >
                        {num} Khách
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShift('Lunch')
                      setTime('12:00')
                    }}
                    className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                      shift === 'Lunch'
                        ? 'border-gold-500 bg-gold-500/10 text-gold-300'
                        : 'border-dark-border bg-dark-card text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <p className="text-xs font-bold">Ca Trưa (Lunch)</p>
                    <p className="text-[11px] text-neutral-500">11:30 &bull; 14:00</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShift('Dinner')
                      setTime('18:30')
                    }}
                    className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                      shift === 'Dinner'
                        ? 'border-gold-500 bg-gold-500/10 text-gold-300'
                        : 'border-dark-border bg-dark-card text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <p className="text-xs font-bold">Ca Tối (Dinner)</p>
                    <p className="text-[11px] text-neutral-500">18:00 &bull; 22:00</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Zone & Table Selection */}
            <div className="rounded-2xl border border-dark-border bg-dark-surface/80 p-6">
              <h2 className="text-sm font-bold text-gold-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>2. Phân Khu & Chọn Bàn Ăn Khả Dụng</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {zones.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setZone(z.id)}
                    className={`cursor-pointer p-3.5 rounded-xl border text-left transition-all ${
                      zone === z.id
                        ? 'border-gold-500 bg-gold-500/10 text-gold-300 shadow-sm'
                        : 'border-dark-border bg-dark-card text-neutral-300 hover:border-gold-500/30'
                    }`}
                  >
                    <p className="text-xs font-bold">{z.name}</p>
                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">{z.desc}</p>
                  </button>
                ))}
              </div>

              {/* Table Selector from Server */}
              <div className="pt-2 border-t border-dark-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                    <span>Bàn ăn phù hợp ({partySize} khách)</span>
                    {isLoadingTables && <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400" />}
                  </label>
                  <button
                    type="button"
                    onClick={() => refetchTables()}
                    className="text-[11px] text-gold-400 hover:underline cursor-pointer"
                  >
                    Làm mới danh sách bàn
                  </button>
                </div>

                {isLoadingTables ? (
                  <div className="p-4 text-center text-xs text-neutral-400">Đang kiểm tra tình trạng bàn ăn thực tế...</div>
                ) : availableTables && availableTables.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableTables.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTableId(t.id)}
                        className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                          selectedTableId === t.id
                            ? 'border-gold-500 bg-gold-500/15 text-gold-300 font-bold'
                            : 'border-dark-border bg-dark-card text-neutral-300 hover:border-gold-500/30'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-sm">{t.tableNumber}</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-neutral-400">
                            {t.capacity} Chỗ
                          </Badge>
                        </div>
                        <span className="text-[11px] text-neutral-400 block mt-1">{t.zoneName}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-dark-card border border-dark-border text-center space-y-3">
                    <p className="text-xs text-neutral-400">
                      Chưa tìm thấy bàn trống trực tiếp từ CSDL trong phân khu này.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await seedSampleDataMutation.mutateAsync()
                        refetchTables()
                      }}
                      loading={seedSampleDataMutation.isPending}
                      className="text-xs text-gold-300 border-gold-500/30"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Khởi tạo dữ liệu bàn mẫu (Seed Tables)
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Date & Contact Details */}
            <div className="rounded-2xl border border-dark-border bg-dark-surface/80 p-6">
              <h2 className="text-sm font-bold text-gold-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>3. Thông Tin Liên Hệ & Giờ Đón</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Ngày dùng bữa</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-dark-card border border-dark-border rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Giờ đón khách</label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-dark-card border border-dark-border rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Họ và tên quý khách</label>
                  <input
                    type="text"
                    required
                    placeholder="Lê Hoàng Thực Khách"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-dark-card border border-dark-border rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      required
                      placeholder="0909999888"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full bg-dark-card border border-dark-border rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Email nhận xác nhận</label>
                    <input
                      type="email"
                      required
                      placeholder="guest@vindining.vn"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full bg-dark-card border border-dark-border rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Ghi chú dị ứng / Yêu cầu đặc biệt</label>
                  <textarea
                    rows={2}
                    placeholder="Dị ứng hải sản có vỏ, kỷ niệm ngày cưới..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full bg-dark-card border border-dark-border rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-gold-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Deposit Summary */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-dark-border bg-dark-surface/90 p-6 sticky top-28">
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider mb-4 pb-2 border-b border-dark-border">
                Tóm Tắt Đặt Bàn
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Số lượng khách:</span>
                  <span className="font-semibold text-neutral-200">{partySize} người</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Ca phục vụ:</span>
                  <span className="font-semibold text-neutral-200">{shift === 'Lunch' ? 'Trưa' : 'Tối'} ({time})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Phân khu:</span>
                  <span className="font-semibold text-neutral-200">{zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Định mức cọc/khách:</span>
                  <span className="text-neutral-300 font-mono">{depositPerGuest.toLocaleString('vi-VN')} VNĐ</span>
                </div>

                <div className="border-t border-dark-border pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-neutral-200">Tổng tiền cọc:</span>
                  <span className="text-lg font-black text-gold-400 font-mono">
                    {totalDeposit.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-[11px] text-neutral-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>
                  Khoản tiền cọc này sẽ được trừ trực tiếp vào hóa đơn thanh toán sau bữa ăn. Hủy trước 4 tiếng hoàn cọc 100%.
                </span>
              </div>

              {errorMessage && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                loading={createReservationMutation.isPending}
                className="w-full mt-6 py-3 uppercase tracking-wider text-xs"
              >
                Xác Nhận & Đặt Chỗ
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default ReservationPage
