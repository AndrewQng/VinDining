import { useEffect, useState } from 'react'

function readSmallViewportHeight(): number {
  if (typeof document === 'undefined' || !document.body) return 800
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none'
  document.body.appendChild(probe)
  const h = probe.getBoundingClientRect().height || window.innerHeight
  probe.remove()
  return Math.round(h)
}

/**
 * The small viewport height (100svh) in pixels. Unlike `innerHeight` it does not
 * change while a phone browser shows or hides its toolbar, so a plan sized from
 * it does not jump during scrolling. It still follows real resizes and rotation.
 */
export function useStableViewportHeight(): number {
  const [height, setHeight] = useState(readSmallViewportHeight)

  useEffect(() => {
    const onResize = () => setHeight(readSmallViewportHeight())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return height
}
