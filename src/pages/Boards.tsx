import { useState } from 'react'
import { useBoard } from '../context/BoardContext'
import { useTeam } from '../context/TeamContext'
import { Link } from 'react-router-dom'

export default function Boards() {
	const { boards, currentBoard, createNewBoard, selectBoard, loading } = useBoard()
	const { currentTeamId } = useTeam()
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [boardName, setBoardName] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleCreateBoard = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!boardName.trim()) return
		
		setError(null)
		setSubmitting(true)
		try {
			await createNewBoard(boardName.trim())
			setBoardName('')
			setShowCreateForm(false)
		} catch (err: any) {
			setError(err?.message || 'Failed to create board')
		} finally {
			setSubmitting(false)
		}
	}

	if (!currentTeamId) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<div className="text-center text-gray-500">
					Please select a team to view boards
				</div>
			</div>
		)
	}

	return (
		<div className="page-container">
			<div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
				{/* Header with Back Navigation and Centered Title - Responsive */}
				<div className="relative">
					{/* Back to Home Button - Positioned absolute */}
					<div className="sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2">
						<Link 
							to="/" 
							className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
							<span className="hidden sm:inline">Back to Home</span>
							<span className="sm:hidden">Home</span>
						</Link>
					</div>
					
					{/* Centered Title */}
					<div className="text-center mt-4 sm:mt-0">
						<h1 className="text-xl sm:text-2xl font-semibold gradient-text">Boards</h1>
					</div>
					
					{/* New Board Button - Positioned absolute on larger screens */}
					<div className="mt-4 sm:mt-0 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 flex justify-center sm:justify-end">
						<button
							onClick={() => setShowCreateForm(true)}
							className="btn-primary w-full sm:w-auto"
						>
							+ New Board
						</button>
					</div>
				</div>

				{/* Create Board Form */}
				{showCreateForm && (
					<div className="card">
						<h2 className="font-medium mb-3">Create New Board</h2>
						<form onSubmit={handleCreateBoard} className="space-y-3">
							{error && <div className="text-red-600 text-sm">{error}</div>}
							<input
								type="text"
								placeholder="Board name"
								value={boardName}
								onChange={(e) => setBoardName(e.target.value)}
								className="w-full input-modern"
								required
							/>
							<div className="flex gap-2">
								<button
									type="submit"
									disabled={submitting}
									className="btn-primary disabled:opacity-50"
								>
									{submitting ? 'Creating...' : 'Create Board'}
								</button>
								<button
									type="button"
									onClick={() => {
										setShowCreateForm(false)
										setBoardName('')
										setError(null)
									}}
									className="btn-secondary"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				)}

				{/* Boards List */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{loading ? (
						<div className="col-span-full text-center text-gray-500">Loading boards...</div>
					) : boards.length === 0 ? (
						<div className="col-span-full text-center text-gray-500">
							No boards yet. Create your first board!
						</div>
					) : (
						boards.map((board) => (
							<div
								key={board.id}
								className={`card-hover bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl p-4 cursor-pointer transition-all ${
									currentBoard?.id === board.id ? 'ring-2 ring-blue-500' : ''
								}`}
								onClick={() => selectBoard(board.id)}
							>
								<div className="font-medium">{board.name}</div>
								<div className="text-sm text-gray-500 mt-1">
									Created {board.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
								</div>
								<div className="mt-4">
									<Link
										to={`/boards/${board.id}`}
										className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 backdrop-blur-sm rounded-xl border border-blue-300/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
										onClick={(e) => e.stopPropagation()}
									>
										<span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
											Open Board
										</span>
										<div className="flex items-center justify-center w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
											<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</div>
									</Link>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	)
}
