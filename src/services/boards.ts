import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

export type Column = {
	id: string
	title: string
	order: number
	boardId: string
	createdAt?: any
}

export type Task = {
	id: string
	title: string
	description?: string
	assignee?: string
	deadline?: any
	priority?: 'low' | 'medium' | 'high'
	columnId: string
	boardId: string
	order: number
	createdAt?: any
	updatedAt?: any
	deleted?: boolean
}

export type Board = {
	id: string
	name: string
	teamId: string
	createdBy: string
	createdAt?: any
}

// Board operations
export async function createBoard(name: string, teamId: string, createdBy: string): Promise<string> {
	const colRef = collection(db, 'boards')
	const boardData = {
		name,
		teamId,
		createdBy,
		createdAt: serverTimestamp(),
	}
	const boardRef = await addDoc(colRef, boardData)
	const boardId = boardRef.id

	// Create default columns
	const defaultColumns = [
		{ title: 'To Do', order: 0 },
		{ title: 'In Progress', order: 1 },
		{ title: 'Done', order: 2 },
	]

	for (const col of defaultColumns) {
		await createColumn(boardId, col.title, col.order)
	}

	return boardId
}

export async function getBoard(boardId: string): Promise<Board | null> {
	const ref = doc(db, 'boards', boardId)
	const snap = await getDoc(ref)
	if (!snap.exists()) return null
	return { id: snap.id, ...(snap.data() as Omit<Board, 'id'>) }
}

export async function getTeamBoards(teamId: string): Promise<Board[]> {
	const colRef = collection(db, 'boards')
	const q = query(colRef, where('teamId', '==', teamId))
	const snap = await getDocs(q)
	return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Board, 'id'>) }))
}

// Delete a board and all its columns and tasks
export async function deleteBoard(boardId: string): Promise<void> {
	// Delete tasks linked to this board
	const taskCol = collection(db, 'tasks')
	const taskQ = query(taskCol, where('boardId', '==', boardId))
	const taskSnap = await getDocs(taskQ)

	// Delete columns linked to this board
	const colCol = collection(db, 'columns')
	const colQ = query(colCol, where('boardId', '==', boardId))
	const colSnap = await getDocs(colQ)

	// Firestore batch limit is 500 operations, chunk if necessary
	const deletes = [...taskSnap.docs, ...colSnap.docs]
	const boardRef = doc(db, 'boards', boardId)
	let batchOps: any[] = []

	const flush = async () => {
		if (batchOps.length === 0) return
		const batch = writeBatch(db)
		for (const ref of batchOps) batch.delete(ref)
		await batch.commit()
		batchOps = []
	}

	for (const d of deletes) {
		batchOps.push(d.ref)
		if (batchOps.length >= 450) {
			await flush()
		}
	}
	await flush()

	// Finally delete the board document
	await writeBatch(db).delete(boardRef).commit()
}

// Column operations
export async function createColumn(boardId: string, title: string, order: number): Promise<string> {
	const colRef = collection(db, 'columns')
	const columnData = {
		title,
		order,
		boardId,
		createdAt: serverTimestamp(),
	}
	const columnRef = await addDoc(colRef, columnData)
	return columnRef.id
}

export async function getBoardColumns(boardId: string): Promise<Column[]> {
	const colRef = collection(db, 'columns')
	const q = query(colRef, where('boardId', '==', boardId))
	const snap = await getDocs(q)
	return snap.docs
		.map((d) => ({ id: d.id, ...(d.data() as Omit<Column, 'id'>) }))
		.sort((a, b) => a.order - b.order)
}

export async function updateColumnOrder(columnId: string, newOrder: number): Promise<void> {
	const ref = doc(db, 'columns', columnId)
	await updateDoc(ref, { order: newOrder })
}

// Delete a column and all its tasks
export async function deleteColumn(columnId: string): Promise<void> {
	// First, get all tasks in this column
	const tasksRef = collection(db, 'tasks')
	const tasksQuery = query(tasksRef, where('columnId', '==', columnId))
	const tasksSnap = await getDocs(tasksQuery)
	
	// Create batch to delete all tasks and the column
	const batch = writeBatch(db)
	
	// Delete all tasks in this column
	tasksSnap.docs.forEach(taskDoc => {
		batch.delete(taskDoc.ref)
	})
	
	// Delete the column
	const columnRef = doc(db, 'columns', columnId)
	batch.delete(columnRef)
	
	// Commit the batch
	await batch.commit()
}

// Task operations
export async function createTask(
	boardId: string,
	columnId: string,
	title: string,
	description?: string,
	assignee?: string,
	deadline?: Date,
	priority: 'low' | 'medium' | 'high' = 'medium'
): Promise<string> {
	const colRef = collection(db, 'tasks')
	
	// Build task data object, only including defined values
	const taskData: any = {
		title,
		priority,
		columnId,
		boardId,
		order: 0, // Will be updated when tasks are reordered
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	}
	
	// Only add optional fields if they have values
	if (description && description.trim()) {
		taskData.description = description.trim()
	}
	if (assignee) {
		taskData.assignee = assignee
	}
	if (deadline) {
		taskData.deadline = deadline
	}
	
	const taskRef = await addDoc(colRef, taskData)
	return taskRef.id
}

export async function getColumnTasks(columnId: string): Promise<Task[]> {
	const colRef = collection(db, 'tasks')
	const q = query(colRef, where('columnId', '==', columnId))
	const snap = await getDocs(q)
	return snap.docs
		.map((d) => ({ id: d.id, ...(d.data() as Omit<Task, 'id'>) }))
		.sort((a, b) => a.order - b.order)
}

export async function moveTask(taskId: string, newColumnId: string, newOrder: number): Promise<void> {
	const ref = doc(db, 'tasks', taskId)
	await updateDoc(ref, {
		columnId: newColumnId,
		order: newOrder,
		updatedAt: serverTimestamp(),
	})
}

export async function updateTask(
	taskId: string,
	updates: Partial<Pick<Task, 'title' | 'description' | 'assignee' | 'deadline' | 'priority'>>
): Promise<void> {
	const ref = doc(db, 'tasks', taskId)
	await updateDoc(ref, {
		...updates,
		updatedAt: serverTimestamp(),
	})
}

export async function deleteTask(taskId: string): Promise<void> {
	const ref = doc(db, 'tasks', taskId)
	await updateDoc(ref, { deleted: true, updatedAt: serverTimestamp() })
}

// Get team members for assignee dropdown
export async function getTeamMembers(teamId: string): Promise<{ id: string, name: string, email: string }[]> {
	try {
		const teamRef = doc(db, 'teams', teamId)
		const teamSnap = await getDoc(teamRef)
		if (!teamSnap.exists()) return []
		
		const teamData = teamSnap.data()
		const memberIds = teamData?.members || []
		
		const members = []
		for (const memberId of memberIds) {
			const userRef = doc(db, 'users', memberId)
			const userSnap = await getDoc(userRef)
			if (userSnap.exists()) {
				const userData = userSnap.data()
				members.push({
					id: memberId,
					name: userData.name || userData.email?.split('@')[0] || 'User',
					email: userData.email || ''
				})
			}
		}
		return members
	} catch (error) {
		console.error('Failed to get team members:', error)
		return []
	}
}

// Real-time listeners
export function subscribeToBoardColumns(boardId: string, callback: (columns: Column[]) => void) {
	const colRef = collection(db, 'columns')
	const q = query(colRef, where('boardId', '==', boardId))
	return onSnapshot(q, (snap) => {
		const columns = snap.docs
			.map((d) => ({ id: d.id, ...(d.data() as Omit<Column, 'id'>) }))
			.sort((a, b) => a.order - b.order)
		callback(columns)
	})
}

// Debounced version of subscribeToColumnTasks to reduce excessive updates
export function subscribeToColumnTasks(columnId: string, callback: (tasks: Task[]) => void) {
	const colRef = collection(db, 'tasks')
	const q = query(colRef, where('columnId', '==', columnId))
	
	let debounceTimer: NodeJS.Timeout | null = null
	let lastTasks: Task[] | null = null
	
	return onSnapshot(q, (snap) => {
		const tasks = snap.docs
			.map((d) => ({ id: d.id, ...(d.data() as Omit<Task, 'id'>) }))
			.filter((task) => !task.deleted)
			.sort((a, b) => a.order - b.order)
		
		// Debounce updates to reduce excessive re-renders during batch operations
		if (debounceTimer) {
			clearTimeout(debounceTimer)
		}
		
		debounceTimer = setTimeout(() => {
			// Only call callback if tasks actually changed
			if (!lastTasks || !areTasksEqual(lastTasks, tasks)) {
				lastTasks = tasks
				callback(tasks)
			}
			debounceTimer = null
		}, 50) // 50ms debounce
	})
}

// Helper function to compare task arrays efficiently
function areTasksEqual(tasks1: Task[], tasks2: Task[]): boolean {
	if (tasks1.length !== tasks2.length) return false
	
	for (let i = 0; i < tasks1.length; i++) {
		const t1 = tasks1[i]
		const t2 = tasks2[i]
		
		if (t1.id !== t2.id || 
			t1.title !== t2.title ||
			t1.description !== t2.description ||
			t1.priority !== t2.priority ||
			t1.assignee !== t2.assignee ||
			t1.columnId !== t2.columnId ||
			t1.order !== t2.order) {
			return false
		}
	}
	
	return true
}

// Batch update task orders for smooth drag and drop using Firestore batch
export async function reorderTasks(updates: { taskId: string, columnId: string, order: number }[]): Promise<void> {
	const batch = writeBatch(db);
	for (const update of updates) {
		const taskRef = doc(db, 'tasks', update.taskId)
		batch.update(taskRef, {
			columnId: update.columnId,
			order: update.order,
			updatedAt: serverTimestamp(),
		})
	}
	await batch.commit()
}

// Helper function to get next order number
export async function getNextTaskOrder(columnId: string): Promise<number> {
	const colRef = collection(db, 'tasks')
	const q = query(colRef, where('columnId', '==', columnId), where('deleted', '!=', true))
	const snap = await getDocs(q)
	const maxOrder = snap.docs.reduce((max, doc) => {
		const order = doc.data().order || 0
		return Math.max(max, order)
	}, -1)
	return maxOrder + 1
}
