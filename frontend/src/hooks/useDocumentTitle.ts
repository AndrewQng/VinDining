import { useEffect } from 'react'

/** Sets the document <title> for the active route ("<Page> · VinDining"). */
export function useDocumentTitle(pageTitle?: string): void {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · VinDining` : 'VinDining'
  }, [pageTitle])
}
