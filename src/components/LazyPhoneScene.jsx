import { Suspense, lazy } from 'react'

/**
 * Code-splits the entire three.js bundle out of the initial payload.
 * The inner component further defers canvas creation until in-view + idle.
 */
const PhoneScene = lazy(() => import('./PhoneScene.jsx'))

export default function LazyPhoneScene(props) {
  return (
    <Suspense fallback={<div className="h-full w-full" aria-hidden />}>
      <PhoneScene {...props} />
    </Suspense>
  )
}
