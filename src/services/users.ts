import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'

export type UserProfile = {
	uid: string
	name: string
	email: string
	role?: string
}

export async function getUserById(uid: string): Promise<UserProfile | null> {
	const ref = doc(db, 'users', uid)
	const snap = await getDoc(ref)
	if (!snap.exists()) return null
	return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) }
}

export async function getUsersByIds(uids: string[]): Promise<Record<string, UserProfile>> {
	const results: Record<string, UserProfile> = {}
	await Promise.all(
		uids.map(async (id) => {
			const u = await getUserById(id)
			if (u) results[id] = u
		})
	)
	return results
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
	const col = collection(db, 'users')
	const q = query(col, where('email', '==', email))
	const snap = await getDocs(q)
	if (snap.empty) return null
	const d = snap.docs[0]
	return { uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }
}


