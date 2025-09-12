import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTeam } from './TeamContext'
import { useAuth } from './AuthContext'
import { 
	type Board, 
	type Column, 
	type Task, 
	createBoard, 
	getTeamBoards, 
	subscribeToBoardColumns, 
	subscribeToColumnTasks,
	deleteBoard,
	deleteColumn
} from '../services/boards'

export type BoardContextValue = {
	boards: Board[]
	currentBoard: Board | null
	columns: Column[]
	tasks: Record<string, Task[]> // columnId -> tasks
	loading: boolean
	createNewBoard: (name: string) => Promise<string>
	deleteCurrentBoard: () => Promise<void>
	deleteColumn: (columnId: string) => Promise<void>
	selectBoard: (boardId: string) => void
	refreshBoards: () => Promise<void>
	// Optimistic update function for drag and drop
	updateTasksOptimistically: (updates: { taskId: string, columnId: string, order: number }[]) => void
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined)

export const BoardProvider = ({ children }: { children: React.ReactNode }) => {
	const { currentTeamId } = useTeam()
	const { user } = useAuth()
	const [boards, setBoards] = useState<Board[]>([])
	const [currentBoard, setCurrentBoard] = useState<Board | null>(null)
	const [columns, setColumns] = useState<Column[]>([])
	const [tasks, setTasks] = useState<Record<string, Task[]>>({})
	const [loading, setLoading] = useState(false)

	// Load team boards when team changes
	useEffect(() => {
		const loadBoards = async () => {
			if (!currentTeamId) {
				setBoards([])
				setCurrentBoard(null)
				return
			}
			setLoading(true)
			try {
				const teamBoards = await getTeamBoards(currentTeamId)
				setBoards(teamBoards)
				if (teamBoards.length > 0 && !currentBoard) {
					setCurrentBoard(teamBoards[0])
				}
			} catch (error) {
				console.error('Failed to load boards:', error)
			} finally {
				setLoading(false)
			}
		}
		loadBoards()
	}, [currentTeamId])

	// Subscribe to columns when board changes
	useEffect(() => {
		if (!currentBoard) {
			setColumns([])
			setTasks({})
			return
		}

		const unsubscribe = subscribeToBoardColumns(currentBoard.id, (newColumns) => {
			setColumns(newColumns)
		})

		return () => unsubscribe()
	}, [currentBoard?.id])

	// Subscribe to tasks for each column
	useEffect(() => {
		if (columns.length === 0) {
			setTasks({})
			return
		}

		const unsubscribes: (() => void)[] = []

		columns.forEach((column) => {
			const unsubscribe = subscribeToColumnTasks(column.id, (columnTasks) => {
				// The debounced subscription already handles comparison, so just update
				setTasks((prev) => ({ ...prev, [column.id]: columnTasks }))
			})
			unsubscribes.push(unsubscribe)
		})

		return () => {
			unsubscribes.forEach((unsub) => unsub())
		}
	}, [columns])

	const createNewBoard = async (name: string) => {
		if (!currentTeamId || !user) throw new Error('No team or user selected')
		const boardId = await createBoard(name, currentTeamId, user.uid)
		await refreshBoards()
		return boardId
	}

	const deleteCurrentBoard = async () => {
		if (!currentBoard) throw new Error('No board selected')
		await deleteBoard(currentBoard.id)
		// Reset current board and refresh
		setCurrentBoard(null)
		await refreshBoards()
	}

	const deleteColumnFunc = async (columnId: string) => {
		await deleteColumn(columnId)
		// The real-time listeners will automatically update the UI
	}

	const selectBoard = (boardId: string) => {
		const board = boards.find((b) => b.id === boardId)
		if (board) setCurrentBoard(board)
	}

	const refreshBoards = async () => {
		if (!currentTeamId) return
		setLoading(true)
		try {
			const teamBoards = await getTeamBoards(currentTeamId)
			setBoards(teamBoards)
		} catch (error) {
			console.error('Failed to refresh boards:', error)
		} finally {
			setLoading(false)
		}
	}

	// Optimistically update tasks for smooth drag and drop
	const updateTasksOptimistically = (updates: { taskId: string, columnId: string, order: number }[]) => {
		setTasks(prev => {
			const newTasks = { ...prev }
			
			// Apply all updates
			updates.forEach(({ taskId, columnId, order }) => {
				// Find the task in current tasks
				let taskToMove: Task | null = null
				let sourceColumnId = ''
				
				// Find and remove task from its current column
				for (const [colId, tasks] of Object.entries(newTasks)) {
					const taskIndex = tasks.findIndex(t => t.id === taskId)
					if (taskIndex !== -1) {
						taskToMove = { ...tasks[taskIndex] }
						sourceColumnId = colId
						newTasks[colId] = tasks.filter(t => t.id !== taskId)
						break
					}
				}
				
				if (taskToMove) {
					// Update task properties
					taskToMove.columnId = columnId
					taskToMove.order = order
					
					// Add to target column
					if (!newTasks[columnId]) newTasks[columnId] = []
					newTasks[columnId] = [...newTasks[columnId], taskToMove]
						.sort((a, b) => a.order - b.order)
					
					// Reorder remaining tasks in source column if different
					if (sourceColumnId !== columnId && newTasks[sourceColumnId]) {
						newTasks[sourceColumnId] = newTasks[sourceColumnId]
							.map((task, index) => ({ ...task, order: index }))
					}
				}
			})
			
			return newTasks
		})
	}

	const value = useMemo(
		() => ({
			boards,
			currentBoard,
			columns,
			tasks,
			loading,
			createNewBoard,
			deleteCurrentBoard,
			deleteColumn: deleteColumnFunc,
			selectBoard,
			refreshBoards,
			updateTasksOptimistically,
		}),
		[boards, currentBoard, columns, tasks, loading]
	)

	return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

export const useBoard = () => {
	const ctx = useContext(BoardContext)
	if (!ctx) throw new Error('useBoard must be used within BoardProvider')
	return ctx
}
