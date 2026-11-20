import { cn } from '@/lib/utils'
import { useThemeStore } from '@/stores/useThemeStore'

export interface GuestPhotoBackgroundProps {
  className?: string
}

/** Fixed full-viewport restaurant hero background with responsive mobile crop and theme-appropriate wash. */
export function GuestPhotoBackground({ className }: GuestPhotoBackgroundProps) {
  const theme = useThemeStore((s) => s.theme)

  return (
    <div
      data-testid="guest-photo-bg"
      aria-hidden="true"
      className={cn(
        'pointer-events-none select-none fixed inset-x-0 top-0 h-[100lvh] z-0 overflow-hidden',
        className
      )}
    >
      <picture className="block w-full h-full">
        <source
          media="(max-width: 639px)"
          srcSet={`/images/${theme}/hero_mobile.jpg`}
        />
        <img
          src={`/images/${theme}/hero_desktop.jpg`}
          alt=""
          className="w-full h-full object-cover"
        />
      </picture>
      <div
        className={cn(
          'absolute inset-0 transition-colors duration-300 motion-reduce:transition-none',
          theme === 'dark'
            ? 'bg-gradient-to-b from-bg/85 via-bg/75 to-bg/90'
            : 'bg-gradient-to-b from-bg/88 via-bg/78 to-bg/90'
        )}
      />
    </div>
  )
}
