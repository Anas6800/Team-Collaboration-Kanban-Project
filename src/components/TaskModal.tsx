import { useState, useEffect } from 'react'
import { updateTask, deleteTask, getTeamMembers } from '../services/boards'
import { useTeam } from '../context/TeamContext'
import { getAvatarProps } from '../utils/avatarUtils'

type TaskModalProps = {
	isOpen: boolean
	onClose: () => void
	task: any
	onTaskUpdated?: () => void
	onTaskDeleted?: () => void
}

export default function TaskModal({ isOpen, onClose, task, onTaskUpdated, onTaskDeleted }: TaskModalProps) {
	const { currentTeamId, canDeleteTasks } = useTeam()
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
	const [assigneeId, setAssigneeId] = useState('')
	const [teamMembers, setTeamMembers] = useState<{ id: string, name: string, email: string }[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	// Load task data when modal opens
	useEffect(() => {
		if (isOpen && task) {
			setTitle(task.title || '')
			setDescription(task.description || '')
			setPriority(task.priority || 'medium')
			setAssigneeId(task.assignee || '')
			setError(null)
			setShowDeleteConfirm(false)
		}
	}, [isOpen, task])

	// Load team members when modal opens
	useEffect(() => {
		const loadTeamMembers = async () => {
			if (isOpen && currentTeamId) {
				const members = await getTeamMembers(currentTeamId)
				setTeamMembers(members)
			}
		}
		loadTeamMembers()
	}, [isOpen, currentTeamId])

	const handleSave = async () => {
		if (!title.trim()) {
			setError('Title is required')
			return
		}

		setLoading(true)
		setError(null)
		try {
			const updates: any = {
				title: title.trim(),
				priority
			}
			
			if (description.trim()) {
				updates.description = description.trim()
			}
			
			if (assigneeId) {
				updates.assignee = assigneeId
			}

			await updateTask(task.id, updates)
			onTaskUpdated?.()
			onClose()
		} catch (err: any) {
			console.error('Failed to update task:', err)
			setError(err?.message || 'Failed to update task')
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = async () => {
		setLoading(true)
		setError(null)
		try {
			await deleteTask(task.id)
			onTaskDeleted?.()
			onClose()
		} catch (err: any) {
			console.error('Failed to delete task:', err)
			setError(err?.message || 'Failed to delete task')
		} finally {
			setLoading(false)
		}
	}

	const getAssigneeName = (id: string) => {
		const member = teamMembers.find(m => m.id === id)
		return member?.name || member?.email || 'Unknown'
	}

	if (!isOpen) return null

		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
				<div className="card w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-semibold gradient-text">Edit Task</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
						{error}
					</div>
				)}

				<div className="space-y-4">
					{/* Title */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Title *
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="input-modern"
							placeholder="Task title"
							required
						/>
					</div>

					{/* Description */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="input-modern resize-none"
							placeholder="Task description (optional)"
							rows={3}
						/>
					</div>

					{/* Priority */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Priority
						</label>
						<select
							value={priority}
							onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
							className="input-modern"
						>
							<option value="low">🟢 Low</option>
							<option value="medium">🟡 Medium</option>
							<option value="high">🔴 High</option>
						</select>
					</div>

					{/* Assignee */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Assignee
						</label>
						<select
							value={assigneeId}
							onChange={(e) => setAssigneeId(e.target.value)}
							className="input-modern"
						>
							<option value="">Unassigned</option>
							{teamMembers.map((member) => (
								<option key={member.id} value={member.id}>
									{member.name} ({member.email})
								</option>
							))}
						</select>
					</div>

					{/* Current assignee display */}
					{assigneeId && (() => {
						const assigneeName = getAssigneeName(assigneeId)
						const avatarProps = getAvatarProps(assigneeName)
						return (
							<div className="flex items-center space-x-2 text-sm text-gray-600">
								<div className={`w-6 h-6 ${avatarProps.color.bg} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
									{avatarProps.initials}
								</div>
								<span>Assigned to {assigneeName}</span>
							</div>
						)
					})()}
				</div>

				{/* Actions */}
				{/* Member permissions info */}
				{!canDeleteTasks() && (
					<div className="mt-6 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
						<div className="flex items-center gap-2 text-sm text-blue-700">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span className="font-medium">Member permissions:</span>
							<span>Only owners can delete tasks</span>
						</div>
					</div>
				)}

				{/* Action buttons */}
				<div className="flex gap-3 mt-8">
					{!showDeleteConfirm ? (
						<>
							<button
								onClick={handleSave}
								disabled={loading || !title.trim()}
								className="btn-primary flex-1 disabled:opacity-50"
							>
								{loading ? 'Saving...' : 'Save Changes'}
							</button>
							{canDeleteTasks() && (
								<button
									onClick={() => setShowDeleteConfirm(true)}
									className="btn-danger px-6"
								>
									Delete
								</button>
							)}
							<button
								onClick={onClose}
								className="btn-secondary px-6"
							>
								Cancel
							</button>
						</>
					) : (
						<>
							<div className="flex-1 text-sm text-red-600 flex items-center">
								⚠️ Are you sure you want to delete this task?
							</div>
							<button
								onClick={handleDelete}
								disabled={loading}
								className="btn-danger px-4"
							>
								{loading ? 'Deleting...' : 'Yes, Delete'}
							</button>
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="btn-secondary px-4"
							>
								Cancel
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	)
}
