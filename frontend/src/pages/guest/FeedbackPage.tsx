import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AlertCircle, CheckCircle2, Star } from 'lucide-react'
import { Button, Card, Skeleton, Textarea } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { feedbackApi } from '@/services/api'
import type { ApiErrorResponse } from '@/types'

interface StarRowProps {
  label: string
  value: number
  onChange: (rating: number) => void
}

function StarRatingRow({ label, value, onChange }: StarRowProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, star: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(Math.min(5, star + 1))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(Math.max(1, star - 1))
    }
  }

  return (
    <div className="rounded-xl bg-card border border-line px-4 py-3 flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= value
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${label}: ${star} sao`}
              onClick={() => onChange(star)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              className="p-1 rounded-md hover:bg-card-hover cursor-pointer"
            >
              <Star
                className={cn(
                  'w-5 h-5 transition-colors',
                  active
                    ? 'text-accent fill-current'
                    : 'text-ink-subtle'
                )}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** G4 — Post-dining CSAT feedback submission page (/danh-gia/:token). */
export function FeedbackPage() {
  useDocumentTitle('Đánh giá dịch vụ')
  const { token = '' } = useParams<{ token: string }>()

  const [foodRating, setFoodRating] = useState(5)
  const [ambienceRating, setAmbienceRating] = useState(5)
  const [serviceRating, setServiceRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const trimmedToken = token.trim()
  const validationQuery = useQuery({
    queryKey: ['feedback-validate', trimmedToken],
    queryFn: () => feedbackApi.validateToken(trimmedToken),
    enabled: Boolean(trimmedToken) && !submitted,
    retry: false,
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      feedbackApi.submit({
        token: trimmedToken,
        foodRating,
        ambienceRating,
        serviceRating,
        comment: comment.trim() || null,
      }),
    onSuccess: () => {
      setErrorMessage(null)
      setSubmitted(true)
    },
    onError: (err) => {
      if (isAxiosError<ApiErrorResponse>(err)) {
        setErrorMessage(
          err.response?.data?.message ??
            'Liên kết đánh giá không hợp lệ hoặc đã được sử dụng.'
        )
      } else {
        setErrorMessage('Không thể gửi đánh giá lúc này.')
      }
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!trimmedToken) {
      setErrorMessage('Liên kết đánh giá không hợp lệ.')
      return
    }
    submitMutation.mutate()
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <Card className="text-center space-y-5 py-10">
          <CheckCircle2
            className="w-10 h-10 text-accent mx-auto"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold text-ink">
              Cảm ơn quý khách
            </h1>
            <p className="text-sm text-ink-muted">
              Đánh giá của quý khách đã được ghi nhận.
            </p>
          </div>
          <Link to="/" className="inline-block">
            <Button>Về trang chủ</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (!trimmedToken || validationQuery.isError) {
    const validationError = !trimmedToken
      ? 'Liên kết đánh giá không hợp lệ.'
      : isAxiosError<ApiErrorResponse>(validationQuery.error)
        ? (validationQuery.error.response?.data?.message ??
          'Liên kết đánh giá không hợp lệ hoặc đã được sử dụng.')
        : 'Không thể xác thực liên kết đánh giá lúc này.'

    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <Card className="text-center space-y-5 py-10">
          <AlertCircle
            className="w-10 h-10 text-danger mx-auto"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold text-ink">
              Không thể mở biểu mẫu đánh giá
            </h1>
            <p role="alert" className="text-sm text-ink-muted">
              {validationError}
            </p>
          </div>
          <Link to="/" className="inline-block">
            <Button>Về trang chủ</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (validationQuery.isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <Card padding="lg" className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Card padding="lg" className="space-y-6">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Đánh giá dịch vụ
        </h1>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-danger/50 bg-danger/10 p-3 flex items-center gap-2 text-sm text-danger"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <StarRatingRow
              label="Món ăn"
              value={foodRating}
              onChange={setFoodRating}
            />
            <StarRatingRow
              label="Không gian"
              value={ambienceRating}
              onChange={setAmbienceRating}
            />
            <StarRatingRow
              label="Thái độ phục vụ"
              value={serviceRating}
              onChange={setServiceRating}
            />
          </div>

          <Textarea
            label="Ý kiến đóng góp"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ thêm cảm nhận của quý khách (tùy chọn)..."
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={submitMutation.isPending}
          >
            Gửi đánh giá
          </Button>
        </form>
      </Card>
    </div>
  )
}
