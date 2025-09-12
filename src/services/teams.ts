import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { getUserByEmail } from './users'

export type Team = {
	id: string
	name: string
	ownerId: string
	members: string[]
	createdAt?: any
	memberInfo?: Record<string, { name?: string; email?: string }>
	deleted?: boolean
	deletedAt?: any
}

export async function createTeam(name: string, ownerId: string): Promise<string> {
	const colRef = collection(db, 'teams')
	const res = await addDoc(colRef, {
		name,
		ownerId,
		members: [ownerId],
		createdAt: serverTimestamp(),
	})
	return res.id
}

export async function listUserTeams(userId: string): Promise<Team[]> {
	const colRef = collection(db, 'teams')
	const q = query(colRef, where('members', 'array-contains', userId))
	const snap = await getDocs(q)
	return snap.docs
		.map((d) => ({ id: d.id, ...(d.data() as Omit<Team, 'id'>) }))
		.filter((team) => !team.deleted) // Filter out deleted teams in JavaScript instead
}

export async function inviteMemberByEmail(teamId: string, email: string): Promise<'added' | 'not_found' | 'already_member'> {
	// users collection must store email -> uid
	const user = await getUserByEmail(email)
	if (!user) return 'not_found'
	const uid = user.uid
	const teamRef = doc(db, 'teams', teamId)
	const teamSnap = await getDoc(teamRef)
	if (!teamSnap.exists()) throw new Error('Team not found')
	const data = teamSnap.data() as Team
	if (data.members?.includes(uid)) return 'already_member'
	await updateDoc(teamRef, { members: arrayUnion(uid) })
	// Also store member info for display even if user profile isn't readable later
	await setDoc(
		teamRef,
		{ memberInfo: { [uid]: { email: user.email, name: user.name } } } as any,
		{ merge: true }
	)
	return 'added'
}

// Delete a team/workspace and all its boards, columns, and tasks
export async function deleteTeam(teamId: string): Promise<void> {
	// Import deleteBoard from boards to avoid circular dependency
	const { deleteBoard } = await import('./boards')
	
	// Get all boards belonging to this team
	const boardsCol = collection(db, 'boards')
	const boardsQ = query(boardsCol, where('teamId', '==', teamId))
	const boardsSnap = await getDocs(boardsQ)
	
	// Delete all boards (this will cascade delete columns and tasks)
	for (const boardDoc of boardsSnap.docs) {
		await deleteBoard(boardDoc.id)
	}
	
	// Finally delete the team document
	const teamRef = doc(db, 'teams', teamId)
	await updateDoc(teamRef, { deleted: true, deletedAt: serverTimestamp() })
}


