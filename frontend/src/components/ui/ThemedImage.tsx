import type { ImgHTMLAttributes } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'

export interface ThemedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  name: string
  alt: string
}

/** Resolves prototype photography from /images/dark/ or /images/light/ based on active theme. */
export function ThemedImage({ name, alt, ...props }: ThemedImageProps) {
  const theme = useThemeStore((s) => s.theme)
  const filename = name.replace(/^.*\//, '')
  const src = `/images/${theme}/${filename}`

  return <img src={src} alt={alt} {...props} />
}
