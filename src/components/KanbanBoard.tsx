import { useBoard } from '../context/BoardContext'
import { useState } from 'react'
import { createTask } from '../services/boards'
import { useAuth } from '../context/AuthContext'
import AddColumnModal from './AddColumnModal'

export default function KanbanBoard() {
	const { currentBoard, columns, tasks, loading } = useBoard()
	const { user } = useAuth()
	const [showAddTask, setShowAddTask] = useState<string | null>(null)
	const [newTaskTitle, setNewTaskTitle] = useState('')
	const [newTaskDescription, setNewTaskDescription] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [showAddColumn, setShowAddColumn] = useState(false)

	const handleCreateTask = async (columnId: string) => {
		if (!newTaskTitle.trim() || !currentBoard || !user) return
		
		setSubmitting(true)
		try {
			await createTask(
				currentBoard.id,
				columnId,
				newTaskTitle.trim(),
				newTaskDescription.trim() || undefined
			)
			setNewTaskTitle('')
			setNewTaskDescription('')
			setShowAddTask(null)
		} catch (error) {
			console.error('Failed to create task:', error)
		} finally {
			setSubmitting(false)
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
					{columns.map((column) => (
						<div key={column.id} className="flex-shrink-0 w-80">
							<div className="column-container">
								{/* Column Header */}
								<div className="flex items-center justify-between mb-6">
									<h3 className="text-lg font-semibold text-gray-900">{column.title}</h3>
									<span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
										{tasks[column.id]?.length || 0}
									</span>
								</div>

								{/* Tasks */}
								<div className="space-y-3 min-h-[300px]">
									{tasks[column.id]?.map((task) => (
										<div
											key={task.id}
											className="task-card"
										>
											<div className="font-medium text-gray-900 mb-2">{task.title}</div>
											{task.description && (
												<div className="text-sm text-gray-600 mb-3 line-clamp-2">
													{task.description}
												</div>
											)}
											{task.priority && (
												<div className="flex justify-between items-center">
													<span
														className={`inline-block px-3 py-1 rounded-full text-xs font-medium priority-${task.priority}`}
													>
														{task.priority}
													</span>
													{task.assignee && (
														<div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
															{task.assignee.charAt(0).toUpperCase()}
														</div>
													)}
												</div>
											)}
										</div>
									))}
								</div>

								{/* Add Task Button */}
								{showAddTask === column.id ? (
									<div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-xl">
										<input
											type="text"
											placeholder="Task title"
											value={newTaskTitle}
											onChange={(e) => setNewTaskTitle(e.target.value)}
											className="input-modern text-sm"
											autoFocus
										/>
										<textarea
											placeholder="Description (optional)"
											value={newTaskDescription}
											onChange={(e) => setNewTaskDescription(e.target.value)}
											className="input-modern text-sm resize-none"
											rows={2}
										/>
										<div className="flex gap-2">
											<button
												onClick={() => handleCreateTask(column.id)}
												disabled={submitting || !newTaskTitle.trim()}
												className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
											>
												{submitting ? 'Adding...' : 'Add Task'}
											</button>
											<button
												onClick={() => {
													setShowAddTask(null)
													setNewTaskTitle('')
													setNewTaskDescription('')
												}}
												className="btn-secondary text-sm px-4 py-2"
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									<button
										onClick={() => setShowAddTask(column.id)}
										className="w-full mt-4 text-gray-500 hover:text-blue-600 text-sm py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-all duration-200 group"
									>
										<div className="flex items-center justify-center space-x-2">
											<svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
											</svg>
											<span>Add a task</span>
										</div>
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Add Column Modal */}
			<AddColumnModal
				isOpen={showAddColumn}
				onClose={() => setShowAddColumn(false)}
			/>
		</div>
	)
}
