import { useState } from 'react'
import { createColumn } from '../services/boards'
import { useBoard } from '../context/BoardContext'

type Props = {
	isOpen: boolean
	onClose: () => void
}

export default function AddColumnModal({ isOpen, onClose }: Props) {
	const { currentBoard, columns } = useBoard()
	const [title, setTitle] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!title.trim() || !currentBoard) return

		setError(null)
		setSubmitting(true)
		try {
			const nextOrder = Math.max(...columns.map(c => c.order), -1) + 1
			await createColumn(currentBoard.id, title.trim(), nextOrder)
			setTitle('')
			onClose()
		} catch (err: any) {
			setError(err?.message || 'Failed to create column')
		} finally {
			setSubmitting(false)
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="card w-full max-w-md">
				<h2 className="text-lg font-semibold mb-4">Add New Column</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && <div className="text-red-600 text-sm">{error}</div>}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Column Title
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full input-modern"
							placeholder="e.g., Review, Testing, Blocked"
							required
							autoFocus
						/>
					</div>
					<div className="flex gap-2 justify-end">
						<button
							type="button"
							onClick={() => {
								onClose()
								setTitle('')
								setError(null)
							}}
							className="btn-secondary"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting || !title.trim()}
							className="btn-primary disabled:opacity-50"
						>
							{submitting ? 'Creating...' : 'Create Column'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
