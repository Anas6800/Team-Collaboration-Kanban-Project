import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { auth, db } from '../firebase'
import {
	type User,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signOut,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

type AuthContextValue = {
	user: User | null
	loading: boolean
	signup: (email: string, password: string, displayName?: string) => Promise<void>
	login: (email: string, password: string) => Promise<void>
	logout: () => Promise<void>
	resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser)
			setLoading(false)
		})
		return () => unsub()
	}, [])

	const signup = async (email: string, password: string, displayName?: string) => {
		const cred = await createUserWithEmailAndPassword(auth, email, password)
		const uid = cred.user.uid
		const userRef = doc(db, 'users', uid)
		const userData = {
			uid,
			email: cred.user.email,
			name: displayName || cred.user.email?.split('@')[0] || 'User',
			role: 'member',
			createdAt: serverTimestamp(),
		}
		console.log('Creating user profile:', userData)
		// Fire-and-forget merged write to avoid blocking the UI on first signup
		void setDoc(userRef, userData, { merge: true })
			.then(() => console.log('User profile created successfully'))
			.catch((e) => {
				console.error('Failed to create user profile', e)
			})
	}

	const login = async (email: string, password: string) => {
		await signInWithEmailAndPassword(auth, email, password)
	}

	const logout = async () => {
		await signOut(auth)
	}

	const resetPassword = async (email: string) => {
		// Ensure action link uses your hosting domain for best deliverability and UX
		await sendPasswordResetEmail(auth, email, {
			url: `${window.location.origin}/login`,
			handleCodeInApp: false,
		})
	}

	const value = useMemo(
		() => ({ user, loading, signup, login, logout, resetPassword }),
		[user, loading]
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used within AuthProvider')
	return ctx
}


