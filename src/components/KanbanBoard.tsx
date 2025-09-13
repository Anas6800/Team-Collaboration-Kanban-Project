import { useBoard } from '../context/BoardContext'
import { useState } from 'react'
import { createTask, deleteTask, deleteColumn } from '../services/boards'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'
import AddColumnModal from './AddColumnModal'
import TaskModal from './TaskModal'
import TaskCreationModal from './TaskCreationModal'
import { doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import {
	DndContext,
	pointerWithin,
	rectIntersection,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragOverlay,
	useDroppable,
} from '@dnd-kit/core'
import type {
	DragStartEvent,
	DragEndEvent,
	DragOverEvent,
} from '@dnd-kit/core'
import {
	SortableContext,
	verticalListSortingStrategy,
	sortableKeyboardCoordinates,
	arrayMove,
} from '@dnd-kit/sortable'
import {
	useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// DropZone component for positioning between tasks
function DropZone({ id, activeId }: { id: string; activeId: string | null }) {
	const { setNodeRef, isOver: isDirectlyOver } = useDroppable({
		id: id,
	})

	// Only show blue bar when actively dragging and hovering over this specific drop zone
	const shouldShowBar = activeId !== null && isDirectlyOver

	return (
		<div
			ref={setNodeRef}
			className={`transition-all duration-150 ${
				shouldShowBar 
					? 'h-1 bg-blue-500 mx-4 my-2 rounded-full' 
					: 'h-1 my-1'
			}`}
			style={{
				pointerEvents: 'auto',
				opacity: shouldShowBar ? 1 : 0
			}}
		/>
	)
}

// SortableTask component with animations
function SortableTask({ task, canDelete, onTaskClick, onDeleteTask }: {
	task: any
	canDelete: boolean
	onTaskClick: (task: any) => void
	onDeleteTask: (taskId: string) => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: task.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 1000 : 1,
		// Hide the original task completely when dragging
		opacity: isDragging ? 0 : 1,
		// Also make it invisible to pointer events when dragging
		pointerEvents: isDragging ? ('none' as const) : ('auto' as const),
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`group cursor-grab active:cursor-grabbing transition-all duration-200 ${
				isDragging 
					? 'scale-105 rotate-1 shadow-2xl shadow-black/20 z-50' 
					: 'hover:shadow-lg hover:-translate-y-0.5'
			}`}
			onClick={() => onTaskClick(task)}
		>
			{/* Modern Clean Card */}
			<div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md">
				{/* Task Title */}
				<div className="mb-3">
					<h3 className="font-semibold text-gray-900 text-sm leading-tight pointer-events-none">
						{task.title}
					</h3>
					{task.description && (
						<p className="text-xs text-gray-600 mt-1 leading-relaxed pointer-events-none line-clamp-2">
							{task.description}
						</p>
					)}
				</div>
				
				{/* Bottom Section */}
				<div className="flex items-center justify-between">
					{/* Priority Badge */}
					<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium pointer-events-none ${
						task.priority === 'high' 
							? 'bg-red-100 text-red-800' :
						task.priority === 'medium' 
							? 'bg-amber-100 text-amber-800' :
							'bg-emerald-100 text-emerald-800'
					}`}>
						{task.priority || 'low'}
					</span>
					
					{/* Right Section */}
					<div className="flex items-center space-x-2">
						{/* Assignee Avatar */}
						{task.assignee && (
							<div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm pointer-events-none">
								{task.assignee.charAt(0).toUpperCase()}
							</div>
						)}
						
						{/* Delete Button */}
						{canDelete && (
							<button
								onClick={(e) => {
									e.stopPropagation()
									onDeleteTask(task.id)
								}}
								className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded-md hover:bg-red-50 pointer-events-auto"
								title="Delete task"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

// Droppable Column component
function DroppableColumn({ column, tasks, canDelete, onTaskClick, onDeleteTask, onDeleteColumn, onShowTaskModal, isOver, activeId }: {
	column: any
	tasks: any[]
	canDelete: boolean
	onTaskClick: (task: any) => void
	onDeleteTask: (taskId: string) => void
	onDeleteColumn: (columnId: string) => void
	onShowTaskModal: (columnId: string) => void
	isOver: boolean
	activeId: string | null
}) {
	const shouldScroll = tasks.length > 3

	// Make the column droppable
	const { setNodeRef } = useDroppable({
		id: column.id,
	})

	return (
		<div className="flex-shrink-0 w-80">
			<div className="bg-gray-50/50 rounded-2xl p-1 transition-all duration-200 backdrop-blur-sm border border-gray-200/50">
				<div 
					ref={setNodeRef}
					className={`bg-white/70 rounded-xl p-4 transition-all duration-300 min-h-[500px] ${
						isOver ? 'bg-blue-50/80 border-2 border-dashed border-blue-300 shadow-lg backdrop-blur-md' : 'border border-transparent'
					}`}
				>
				{/* Column Header */}
				<div className={`flex items-center justify-between mb-6 transition-all duration-300 ${
					isOver ? 'transform -translate-y-1' : ''
				}`}>
					<h3 className={`text-lg font-semibold transition-colors duration-300 ${
						isOver ? 'text-blue-700' : 'text-gray-900'
					}`}>{column.title}</h3>
					<div className="flex items-center space-x-3">
						<span className={`text-sm font-medium px-3 py-1 rounded-full shadow-lg transition-all duration-300 ${
							isOver 
								? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-110' 
								: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
						}`}>
							{tasks.length}
						</span>
						{canDelete && (
							<button
								onClick={() => onDeleteColumn(column.id)}
								className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
								title="Delete column"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						)}
					</div>
				</div>

				{/* Tasks Container with conditional scrolling */}
				<div className={`transition-all duration-300 ${
					shouldScroll ? 'max-h-[400px] overflow-y-auto' : ''
				}`}>
					<SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
						{/* Top drop zone */}
						<DropZone 
							id={`${column.id}-top`} 
							activeId={activeId}
						/>
						
						{/* Tasks with drop zones between them */}
						{tasks.map((task, index) => (
							<div key={task.id}>
								<SortableTask
									task={task}
									canDelete={canDelete}
									onTaskClick={onTaskClick}
									onDeleteTask={onDeleteTask}
								/>
								{/* Drop zone after each task (except the last one gets the bottom drop zone) */}
								{index < tasks.length - 1 && (
									<DropZone 
										id={`${column.id}-${index + 1}`} 
										activeId={activeId}
									/>
								)}
							</div>
						))}
						
						{/* Bottom drop zone */}
						<DropZone 
							id={`${column.id}-bottom`} 
							activeId={activeId}
						/>
					</SortableContext>
					
					{/* Beautiful Empty state */}
					{tasks.length === 0 && !isOver && (
						<div className="flex items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
							<div className="text-center">
								<div className="mb-3 text-4xl opacity-50">📝</div>
								<div className="font-medium text-gray-500">No tasks yet</div>
								<div className="text-sm text-gray-400 mt-1">Drag tasks here or click + to add</div>
							</div>
						</div>
					)}
				</div>

				{/* Add Task Button */}
				<button
					onClick={() => onShowTaskModal(column.id)}
					className="w-full mt-4 text-gray-500 hover:text-blue-600 text-sm py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-all duration-300 group hover:bg-blue-50/50"
				>
					<div className="flex items-center justify-center space-x-2">
						<svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						<span className="font-medium">Add a task</span>
					</div>
				</button>
				</div>
			</div>
		</div>
	)
}

export default function KanbanBoard() {
	const { currentBoard, columns, tasks, loading } = useBoard()
	const { user } = useAuth()
	const { isOwner } = useTeam()
	const [submitting, setSubmitting] = useState(false)
	const [showAddColumn, setShowAddColumn] = useState(false)
	const [activeId, setActiveId] = useState<string | null>(null)
	const [showTaskModal, setShowTaskModal] = useState(false)
	const [selectedTask, setSelectedTask] = useState<any>(null)
	const [showDeleteColumnConfirm, setShowDeleteColumnConfirm] = useState<string | null>(null)
	const [deletingColumn, setDeletingColumn] = useState(false)
	const [overId, setOverId] = useState<string | null>(null)
	
	// Task creation modal
	const [showTaskCreationModal, setShowTaskCreationModal] = useState(false)
	const [selectedColumnForTask, setSelectedColumnForTask] = useState<string | null>(null)

	// Sensors for drag and drop
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 10,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	// Custom collision detection that prioritizes drop zones over tasks
	const customCollisionDetection = (args: any) => {
		// First try pointer-based collision detection
		const pointerCollisions = pointerWithin(args)
		
		// If we have pointer collisions, filter to prioritize drop zones
		if (pointerCollisions.length > 0) {
			// Prioritize drop zones (those with dashes in their IDs)
			const dropZoneCollisions = pointerCollisions.filter((collision: any) => 
				typeof collision.id === 'string' && collision.id.includes('-')
			)
			
			// If we found drop zone collisions, return the first one
			if (dropZoneCollisions.length > 0) {
				return [dropZoneCollisions[0]]
			}
			
			// Otherwise return the first pointer collision
			return [pointerCollisions[0]]
		}
		
		// Fallback to rect intersection if no pointer collisions
		return rectIntersection(args)
	}

	// Check if current user is owner (use the function from TeamContext)
	const canDelete = isOwner()

	// Get active task for drag overlay
	const activeTask = activeId ? 
		Object.values(tasks).flat().find((task: any) => task.id === activeId) : null

	// Show task creation modal
	const handleShowTaskModal = (columnId: string) => {
		setSelectedColumnForTask(columnId)
		setShowTaskCreationModal(true)
	}
	
	// Create task from modal
	const handleCreateTaskFromModal = async (taskData: {
		title: string
		description: string
		priority: 'low' | 'medium' | 'high'
		assignee: string
	}) => {
		if (!selectedColumnForTask || !currentBoard || !user) return
		
		setSubmitting(true)
		try {
			await createTask(
				currentBoard.id,
				selectedColumnForTask,
				taskData.title,
				taskData.description || undefined,
				taskData.assignee || undefined,
				undefined, // deadline
				taskData.priority
			)
			
			// Close modal
			setShowTaskCreationModal(false)
			setSelectedColumnForTask(null)
		} catch (error) {
			console.error('Failed to create task:', error)
		} finally {
			setSubmitting(false)
		}
	}
	
	// Close task creation modal
	const handleCloseTaskModal = () => {
		setShowTaskCreationModal(false)
		setSelectedColumnForTask(null)
	}

	// DndKit drag handlers
	function handleDragStart(event: DragStartEvent) {
		setActiveId(event.active.id as string)
	}

	function handleDragOver(event: DragOverEvent) {
		const { over } = event
		setOverId(over ? over.id as string : null)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		
		setActiveId(null)
		setOverId(null)

		if (!over || !currentBoard) return

		const activeTask = Object.values(tasks).flat().find((task: any) => task.id === active.id)
		if (!activeTask) return

		const overId = over.id as string
		
		// Check if dropping on a task
		const overTask = Object.values(tasks).flat().find((task: any) => task.id === overId)
		
		if (overTask) {
			// Dropping over another task - insert before this task
			const targetColumnId = overTask.columnId
			const targetTasks = tasks[targetColumnId] || []
			const insertIndex = targetTasks.findIndex((task: any) => task.id === overId)
			
			if (activeTask.columnId === targetColumnId) {
				// Reordering within the same column
				const oldIndex = targetTasks.findIndex((task: any) => task.id === active.id)
				if (oldIndex !== insertIndex && oldIndex !== -1 && insertIndex !== -1) {
					const reorderedTasks = arrayMove(targetTasks, oldIndex, insertIndex)
					updateTaskOrdersInColumn(targetColumnId, reorderedTasks)
				}
			} else {
				// Moving to different column, insert at specific position
				moveTaskToColumnAtIndex(activeTask, targetColumnId, insertIndex)
			}
			return
		}
		
		// Check if dropping on a drop zone
		if (overId.includes('-')) {
			const [columnId, positionStr] = overId.split('-')
			let position: number
			
			if (positionStr === 'top') {
				position = 0
			} else if (positionStr === 'bottom') {
				const columnTasks = tasks[columnId] || []
				position = columnTasks.length
			} else {
				position = parseInt(positionStr) || 0
			}
			
			if (activeTask.columnId === columnId) {
				// Reordering within the same column
				const columnTasks = tasks[columnId] || []
				const oldIndex = columnTasks.findIndex((task: any) => task.id === active.id)
				
				if (oldIndex !== -1 && oldIndex !== position) {
					const reorderedTasks = arrayMove(columnTasks, oldIndex, position)
					updateTaskOrdersInColumn(columnId, reorderedTasks)
				}
			} else {
				// Moving to different column at specific position
				moveTaskToColumnAtIndex(activeTask, columnId, position)
			}
			return
		}
		
		// Dropping directly on column (move to end)
		if (activeTask.columnId !== overId) {
			moveTaskToColumn(activeTask, overId)
		}
	}

	async function moveTaskToColumn(task: any, targetColumnId: string) {
		if (!currentBoard) return

		try {
			const taskRef = doc(db, 'tasks', task.id)
			const targetTasks = tasks[targetColumnId] || []
			const newOrder = targetTasks.length * 1000 // Add to end with proper spacing
			
			await updateDoc(taskRef, {
				columnId: targetColumnId,
				order: newOrder
			})
			console.log('Task moved to column successfully')
		} catch (error) {
			console.error('Failed to move task:', error)
		}
	}
	
	async function moveTaskToColumnAtIndex(task: any, targetColumnId: string, insertIndex: number) {
		if (!currentBoard) return

		try {
			const targetTasks = tasks[targetColumnId] || []
			const batch = writeBatch(db)

			// Create a new array with the task inserted at the specified index
			const tasksWithoutActive = targetTasks.filter((t: any) => t.id !== task.id)
			const reorderedTasks = [...tasksWithoutActive]
			reorderedTasks.splice(insertIndex, 0, { ...task, columnId: targetColumnId })

			// Update all tasks in the target column with new orders
			reorderedTasks.forEach((taskItem: any, i: number) => {
				const newOrder = i * 1000 // Give enough space between orders
				batch.update(doc(db, 'tasks', taskItem.id), {
					columnId: targetColumnId,
					order: newOrder
				})
			})

			await batch.commit()
			console.log('Task moved to column at index successfully')
		} catch (error) {
			console.error('Failed to move task to index:', error)
		}
	}
	
	async function updateTaskOrdersInColumn(_columnId: string, reorderedTasks: any[]) {
		if (!currentBoard) return

		try {
			const batch = writeBatch(db)
			
			reorderedTasks.forEach((task, index) => {
				const newOrder = index * 1000 // Give enough space between orders
				batch.update(doc(db, 'tasks', task.id), {
					order: newOrder
				})
			})
			
			await batch.commit()
			console.log('Task orders updated successfully')
		} catch (error) {
			console.error('Failed to update task orders:', error)
		}
	}

	// Task click handler
	const handleTaskClick = (task: any) => {
		setSelectedTask(task)
		setShowTaskModal(true)
	}

	// Delete task handler
	const handleDeleteTask = async (taskId: string) => {
		if (!canDelete) return
		
		try {
			await deleteTask(taskId)
		} catch (error) {
			console.error('Failed to delete task:', error)
		}
	}

	// Delete column handler
	const handleDeleteColumn = (columnId: string) => {
		if (!canDelete) return
		setShowDeleteColumnConfirm(columnId)
	}

	const confirmDeleteColumn = async () => {
		if (!showDeleteColumnConfirm || !currentBoard || !canDelete) return

		setDeletingColumn(true)
		try {
			await deleteColumn(showDeleteColumnConfirm)
			setShowDeleteColumnConfirm(null)
		} catch (error) {
			console.error('Failed to delete column:', error)
		} finally {
			setDeletingColumn(false)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-gray-500">Loading board...</div>
			</div>
		)
	}

	if (!currentBoard) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-gray-500">No board selected</div>
			</div>
		)
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={customCollisionDetection}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
		>
			<div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
				{/* Board Header */}
				<div className="bg-white/80 backdrop-blur-md border-b border-gray-200 p-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold gradient-text">{currentBoard.name}</h1>
							<p className="text-gray-600 mt-1">Team workspace board</p>
						</div>
						<button
							onClick={() => setShowAddColumn(true)}
							className="btn-primary flex items-center space-x-2"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							<span>Add Column</span>
						</button>
					</div>
				</div>

				{/* Kanban Columns */}
				<div className="flex-1 overflow-x-auto p-6">
					<div className="flex gap-6 min-w-max">
						{columns.map((column) => {
							const columnTasks = tasks[column.id] || []
							const isOver = Boolean(overId === column.id || 
								(overId && columnTasks.some((task: any) => task.id === overId)))
							
							return (
								<DroppableColumn
									key={column.id}
									column={column}
									tasks={columnTasks}
									canDelete={canDelete}
									onTaskClick={handleTaskClick}
									onDeleteTask={handleDeleteTask}
									onDeleteColumn={handleDeleteColumn}
									onShowTaskModal={handleShowTaskModal}
									isOver={isOver}
									activeId={activeId}
								/>
							)
						})}
					</div>
				</div>

				{/* Drag Overlay */}
				<DragOverlay>
				{activeTask ? (
					<div className="bg-white rounded-xl p-4 shadow-2xl shadow-black/30 border border-gray-200 opacity-95 rotate-2 scale-110 max-w-xs cursor-grabbing">
						{/* Task Title */}
						<div className="mb-3">
							<h3 className="font-semibold text-gray-900 text-sm leading-tight">
								{activeTask.title}
							</h3>
							{activeTask.description && (
								<p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
									{activeTask.description}
								</p>
							)}
						</div>
						
						{/* Bottom Section */}
						<div className="flex items-center justify-between">
							{/* Priority Badge */}
							<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
								activeTask.priority === 'high' 
									? 'bg-red-100 text-red-800' :
								activeTask.priority === 'medium' 
									? 'bg-amber-100 text-amber-800' :
									'bg-emerald-100 text-emerald-800'
							}`}>
								{activeTask.priority || 'low'}
							</span>
							
							{/* Assignee Avatar */}
							{activeTask.assignee && (
								<div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
									{activeTask.assignee.charAt(0).toUpperCase()}
								</div>
							)}
						</div>
					</div>
					) : null}
				</DragOverlay>
			</div>

			{/* Add Column Modal */}
			<AddColumnModal
				isOpen={showAddColumn}
				onClose={() => setShowAddColumn(false)}
			/>

			{/* Task Creation Modal */}
			<TaskCreationModal
				isOpen={showTaskCreationModal}
				onClose={handleCloseTaskModal}
				onCreateTask={handleCreateTaskFromModal}
				columnTitle={selectedColumnForTask ? columns.find(c => c.id === selectedColumnForTask)?.title || 'Column' : 'Column'}
				submitting={submitting}
			/>

			{/* Task Edit Modal */}
			<TaskModal
				isOpen={showTaskModal}
				onClose={() => {
					setShowTaskModal(false)
					setSelectedTask(null)
				}}
				task={selectedTask}
				onTaskUpdated={() => {
					// Task will be updated via real-time listeners
					console.log('Task updated successfully')
				}}
				onTaskDeleted={() => {
					// Task will be removed via real-time listeners
					console.log('Task deleted successfully')
				}}
			/>

			{/* Delete Column Confirmation Modal */}
			{showDeleteColumnConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => setShowDeleteColumnConfirm(null)}
					/>
					<div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
						<h3 className="text-lg font-semibold text-gray-900">Delete column?</h3>
						<p className="text-sm text-gray-600 mt-2">
							Are you sure you want to delete the column "
							<span className="font-medium">
								{columns.find(c => c.id === showDeleteColumnConfirm)?.title || 'this column'}
							</span>"?
							All tasks in this column will be permanently removed. This action cannot be undone.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<button
								onClick={() => setShowDeleteColumnConfirm(null)}
								className="btn-secondary"
							>
								Cancel
							</button>
							<button
								onClick={confirmDeleteColumn}
								disabled={deletingColumn}
								className="btn-danger"
							>
								{deletingColumn ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			)}
		</DndContext>
	)
}
