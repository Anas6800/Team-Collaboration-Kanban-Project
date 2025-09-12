import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
	const { login } = useAuth()
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			await login(email, password)
			navigate('/')
		} catch (err: any) {
			setError(err?.message || 'Failed to login')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="auth-container">
			<div className="w-full max-w-md animate-fadeInUp">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-extrabold gradient-text mb-2">Welcome Back</h1>
					<p className="text-gray-600">Sign in to your account to continue</p>
				</div>
				
				<div className="card">
					<form onSubmit={onSubmit} className="space-y-6">
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
								{error}
							</div>
						)}
						
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
								<input
									type="email"
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="input-modern"
									required
								/>
							</div>
							
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
								<input
									type="password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="input-modern"
									required
								/>
							</div>
						</div>
						
						<button 
							disabled={loading} 
							className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<div className="flex items-center justify-center">
									<div className="loading-spinner mr-2"></div>
									Signing in...
								</div>
							) : (
								'Sign In'
							)}
						</button>
						
						<div className="text-center space-y-3">
							<Link to="/forgot" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
								Forgot your password?
							</Link>
							<div className="text-gray-600 text-sm">
								Don't have an account?{' '}
								<Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
									Sign up
								</Link>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}


