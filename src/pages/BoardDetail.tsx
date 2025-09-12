import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBoard } from '../context/BoardContext'
import KanbanBoard from '../components/KanbanBoard'
import { Link } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'

export default function BoardDetail() {
	const { boardId } = useParams()
	const navigate = useNavigate()
	const { currentBoard, selectBoard, deleteCurrentBoard } = useBoard()
	const { canDeleteTasks } = useTeam()
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [deleting, setDeleting] = useState(false)

	// Select the board when component mounts
	React.useEffect(() => {
		if (boardId && boardId !== currentBoard?.id) {
			selectBoard(boardId)
		}
	}, [boardId, selectBoard, currentBoard?.id])

	const handleDeleteBoard = async () => {
		setDeleting(true)
		try {
			await deleteCurrentBoard()
			navigate('/boards')
		} catch (error) {
			console.error('Failed to delete board:', error)
			alert('Failed to delete board. Please try again.')
		} finally {
			setDeleting(false)
			setShowDeleteConfirm(false)
		}
	}

	if (!currentBoard) {
		return (
			<div className="h-screen flex items-center justify-center">
				<div className="text-gray-500">Loading board...</div>
			</div>
		)
	}

	return (
		<div className="h-screen flex flex-col page-container">
			{/* Header - Responsive */}
			<div className="nav-glass p-4 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex items-center gap-3 sm:gap-4">
						<Link 
							to="/boards" 
							className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
							<span className="hidden sm:inline">Back to Boards</span>
							<span className="sm:hidden">Back</span>
						</Link>
					</div>
					<div className="flex flex-wrap items-center gap-2 sm:gap-3">
						<div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
							<span className="text-xs font-medium">Live</span>
						</div>
						<div className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium border ${canDeleteTasks() ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
							{canDeleteTasks() ? 'Owner' : 'Member'}
						</div>
						{canDeleteTasks() && (
							<button
								onClick={() => setShowDeleteConfirm(true)}
								className="btn-danger text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
							>
								<span className="hidden sm:inline">Delete Board</span>
								<span className="sm:hidden">Delete</span>
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Kanban Board */}
			<div className="flex-1 overflow-hidden">
				<KanbanBoard />
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="card w-full max-w-md">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-semibold text-red-600">Delete Board</h2>
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="text-gray-400 hover:text-gray-600 transition-colors"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						
						<div className="mb-6">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
									<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">Are you sure?</h3>
									<p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
								</div>
							</div>
							<p className="text-gray-700 mb-2">
								This will permanently delete <strong>"{currentBoard?.name}"</strong> and all its:
							</p>
							<ul className="text-sm text-gray-600 ml-4 space-y-1">
								<li>• All columns and tasks</li>
								<li>• All task assignments and data</li>
								<li>• All board history</li>
							</ul>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="btn-secondary flex-1"
								disabled={deleting}
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteBoard}
								className="btn-danger flex-1"
								disabled={deleting}
							>
								{deleting ? 'Deleting...' : 'Delete Forever'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
