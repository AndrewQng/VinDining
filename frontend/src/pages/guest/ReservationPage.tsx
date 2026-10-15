import { useState } from 'react'
import { Calendar, Users, Clock, MapPin, Sparkles, Check, AlertCircle } from 'lucide-react'
import type { DiningShift } from '@/types/reservation'
import type { TableZone } from '@/types/table'

export function ReservationPage() {
  const [partySize, setPartySize] = useState(2)
  const [shift, setShift] = useState<DiningShift>('Dinner')
  const [zone, setZone] = useState<TableZone>('MainHall')
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [time, setTime] = useState('18:30')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Standard Fine Dining Deposit: 500,000 VND per guest
  const depositPerGuest = 500000
  const totalDeposit = partySize * depositPerGuest

  const zones: { id: TableZone; name: string; desc: string }[] = [
    { id: 'MainHall', name: 'Đại Sảnh (Main Hall)', desc: 'Không gian mở thanh lịch, ánh nến lung linh' },
    { id: 'VIP', name: 'Phòng VIP Riêng Tư', desc: 'Không gian biệt lập dành cho tiệc riêng tư và đối tác' },
    { id: 'Balcony', name: 'Ban Công (Balcony)', desc: 'Tầm nhìn thoáng đãng ngắm trọn cảnh quan đêm' },
    { id: 'Terrace', name: 'Sân Vườn (Terrace)', desc: 'Không gian ngoài trời lãng mạn hòa quyện thiên nhiên' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
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

      {submitted ? (
        <div className="rounded-2xl border border-gold-500/30 bg-dark-surface/90 p-8 text-center max-w-lg mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-100 mb-2">Đăng Ký Đặt Bàn Đã Ghi Nhận</h2>
          <p className="text-xs text-neutral-400 mb-6">
            Mã phiên đặt chỗ cho quý khách <strong className="text-gold-300">{guestName}</strong> ({partySize} khách) ngày {date} lúc {time}.
          </p>

          <div className="rounded-xl bg-dark-card border border-dark-border p-4 text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-neutral-400">Phân khu:</span>
              <span className="font-semibold text-neutral-200">{zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Ca phục vụ:</span>
              <span className="font-semibold text-neutral-200">{shift === 'Lunch' ? 'Ca Trưa' : 'Ca Tối'}</span>
            </div>
            <div className="flex justify-between border-t border-dark-border pt-2">
              <span className="text-neutral-400">Tiền cọc giữ chỗ:</span>
              <span className="font-bold text-gold-400">{totalDeposit.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          </div>

          <button
            onClick={() => setSubmitted(false)}
            className="cursor-pointer px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-neutral-950 font-bold text-xs transition-colors"
          >
            Tạo Lịch Đặt Mới
          </button>
        </div>
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
                    onClick={() => setShift('Lunch')}
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
                    onClick={() => setShift('Dinner')}
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

            {/* Step 2: Zone Selection */}
            <div className="rounded-2xl border border-dark-border bg-dark-surface/80 p-6">
              <h2 className="text-sm font-bold text-gold-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>2. Chọn Khu Vực Bàn Ăn</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="Nguyễn Văn A"
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
                      placeholder="0912345678"
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
                      placeholder="guest@example.com"
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

              <button
                type="submit"
                className="cursor-pointer w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-neutral-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-gold-500/20 transition-all duration-200"
              >
                Xác Nhận & Đặt Chỗ
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default ReservationPage
