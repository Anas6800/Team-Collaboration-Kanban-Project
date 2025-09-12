import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
	children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
	const { user, loading } = useAuth()
	if (loading) return <div className="grid place-items-center h-screen">Loading...</div>
	if (!user) return <Navigate to="/login" replace />
	return <>{children}</>
}


