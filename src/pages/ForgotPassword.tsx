import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      await resetPassword(email)
      setMessage('Reset link sent. Check your inbox!')
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={onSubmit} className="w-full max-w-sm card space-y-4 animate-fadeInUp">
        <h1 className="text-2xl font-semibold gradient-text">Forgot password</h1>
        {message && <div className="text-green-700 text-sm">{message}</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-modern"
          required
        />
        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
        <div className="text-sm">
          <Link to="/login" className="text-blue-600">Back to login</Link>
        </div>
      </form>
    </div>
  )
}


