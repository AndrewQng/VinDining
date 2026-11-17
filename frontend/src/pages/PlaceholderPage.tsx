import { Layers } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '@/components/ui'

export interface PlaceholderPageProps {
  title: string
  subtitle?: string
  backTo?: string
}

/** Clean Phase 1 placeholder card preserving all planned routes without banned content. */
export function PlaceholderPage({
  title,
  subtitle,
  backTo,
}: PlaceholderPageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageHeader title={title} subtitle={subtitle} backTo={backTo} />
      <Card>
        <EmptyState
          icon={<Layers className="w-5 h-5" />}
          title={title}
          description="Màn hình này sẽ được xây dựng ở giai đoạn tiếp theo"
        />
      </Card>
    </div>
  )
}
