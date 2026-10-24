// Dev-only: throws during render so the error boundary can be checked at /__crash.
export default function DevCrash() {
  throw new Error('Intentional test crash (dev only)')
}
