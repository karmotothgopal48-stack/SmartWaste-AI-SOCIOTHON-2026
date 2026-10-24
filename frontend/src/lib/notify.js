import toast from 'react-hot-toast'
import { getErrorMessage } from '../services/api'

/**
 * Error toast with de-duplication: when the backend is down, every page section fails at once,
 * but the user should see one "offline" toast, not five.
 */
export function notifyError(err) {
  const message = getErrorMessage(err)
  toast.error(message, { id: err?.status === 0 ? 'network-error' : message })
}
