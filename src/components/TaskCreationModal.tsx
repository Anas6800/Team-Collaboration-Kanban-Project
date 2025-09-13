import { useState, useEffect } from 'react'
import { useTeam } from '../context/TeamContext'

interface TaskCreationModalProps {
	isOpen: boolean
	onClose: () => void
	onCreateTask: (taskData: {
		title: string
		description: string
		priority: 'low' | 'medium' | 'high'
		assignee: string
	}) => void
	columnTitle: string
	submitting: boolean
}

export default function TaskCreationModal({
	isOpen,
	onClose,
	onCreateTask,
	columnTitle,
	submitting
}: TaskCreationModalProps) {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low')
	const [assignee, setAssignee] = useState('')
	const [searchTerm, setSearchTerm] = useState('')
	const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)

	const { teamMembers, fetchTeamMembers } = useTeam()

	// Fetch team members when modal opens
	useEffect(() => {
		if (isOpen) {
			fetchTeamMembers()
		}
	}, [isOpen, fetchTeamMembers])

	// Filter team members based on search term
	const filteredMembers = teamMembers.filter(member =>
		member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		member.email.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!title.trim()) return

		onCreateTask({
			title: title.trim(),
			description: description.trim(),
			priority,
			assignee: assignee.trim()
		})

		// Reset form
		setTitle('')
		setDescription('')
		setPriority('low')
		setAssignee('')
		setSearchTerm('')
		setShowAssigneeDropdown(false)
	}

	const handleClose = () => {
		setTitle('')
		setDescription('')
		setPriority('low')
		setAssignee('')
		setSearchTerm('')
		setShowAssigneeDropdown(false)
		onClose()
	}

	const selectAssignee = (member: any) => {
		// Handle "Unassigned" selection
		if (member.name === 'Unassigned') {
			setAssignee('')
			setSearchTerm('')
		} else {
			setAssignee(member.name)
			setSearchTerm(member.name)
		}
		setShowAssigneeDropdown(false)
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
				{/* Header */}
				<div className="p-6 pb-4 border-b border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
							<p className="text-sm text-gray-600 mt-1">Adding to <span className="font-medium text-blue-600">{columnTitle}</span></p>
						</div>
						<button
							onClick={handleClose}
							className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-5">
					{/* Task Title */}
					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							Task Title <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							placeholder="Enter a descriptive title for your task..."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
							autoFocus
							required
						/>
					</div>

					{/* Task Description */}
					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							Description
						</label>
						<textarea
							placeholder="Add more details about this task (optional)..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none"
							rows={3}
						/>
					</div>

					{/* Priority and Assignee Row */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* Priority Selection */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Priority
							</label>
							<div className="relative">
								<select
									value={priority}
									onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
									className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-white appearance-none pr-10"
								>
									<option value="low">🟢 Low Priority</option>
									<option value="medium">🟡 Medium Priority</option>
									<option value="high">🔴 High Priority</option>
								</select>
								<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
									<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</div>
							</div>
						</div>

						{/* Assignee Selection */}
						<div className="relative">
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Assign To
							</label>
							<div className="relative">
								<input
									type="text"
									placeholder={assignee ? assignee : "Search team members..."}
									value={searchTerm}
									onChange={(e) => {
										// If user starts typing over a selected assignee, clear the selection
										if (assignee && e.target.value !== searchTerm) {
											setAssignee('')
										}
										setSearchTerm(e.target.value)
										setShowAssigneeDropdown(true)
									}}
									onFocus={() => setShowAssigneeDropdown(true)}
									className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm pr-20"
								/>
								<div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
									{/* Clear button - only show if there's an assignee selected */}
									{assignee && (
										<button
											type="button"
											onClick={() => {
												setAssignee('')
												setSearchTerm('')
											}}
											className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									)}
									<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								</div>

								{/* Assignee Dropdown */}
								{showAssigneeDropdown && (
									<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
										{filteredMembers.length > 0 ? (
											<>
												{filteredMembers.map((member) => (
													<div
														key={member.id}
														onClick={() => selectAssignee(member)}
														className="flex items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
													>
														<div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
															{member.name.charAt(0).toUpperCase()}
														</div>
														<div>
															<div className="text-sm font-medium text-gray-900">{member.name}</div>
															<div className="text-xs text-gray-500">{member.email}</div>
														</div>
													</div>
												))}
												<div 
													onClick={() => selectAssignee({ name: 'Unassigned', email: '' })}
													className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors text-gray-500"
												>
													<div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
														?
													</div>
													<div className="text-sm">Leave unassigned</div>
												</div>
											</>
										) : (
											<div className="p-4 text-center text-gray-500 text-sm">
												No team members found
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4">
						<button
							type="submit"
							disabled={submitting || !title.trim()}
							className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 text-sm flex items-center justify-center"
						>
							{submitting ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
									Creating...
								</>
							) : (
								<>
									<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Create Task
								</>
							)}
						</button>
						<button
							type="button"
							onClick={handleClose}
							disabled={submitting}
							className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
