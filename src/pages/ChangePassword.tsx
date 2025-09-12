import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'

export default function ChangePassword() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!user || !user.email) {
      setError('Not authenticated')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current password')
      return
    }
    try {
      setLoading(true)
      const cred = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, newPassword)
      setMessage('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4 gradient-text">Change password</h1>
        <form onSubmit={onSubmit} className="card space-y-4 animate-fadeInUp">
          {message && <div className="text-green-700 text-sm">{message}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-modern"
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-modern"
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-modern"
            required
          />
          <button disabled={loading} className="btn-primary w-full">
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}


