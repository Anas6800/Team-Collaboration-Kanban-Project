import { type FormEvent, useEffect, useState } from 'react'
import { useTeam } from '../context/TeamContext'
import { Link } from 'react-router-dom'
import { getUserById, type UserProfile } from '../services/users'

export default function Teams() {
	const { teams, currentTeamId, createNewTeam, switchTeam, loading } = useTeam()
	const [name, setName] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [ownerMap, setOwnerMap] = useState<Record<string, UserProfile>>({})

	useEffect(() => {
		const run = async () => {
			const ownerIds = Array.from(new Set(teams.map((t) => t.ownerId)))
			const entries = await Promise.all(ownerIds.map(async (id) => [id, await getUserById(id)] as const))
			const map: Record<string, UserProfile> = {}
			for (const [id, prof] of entries) {
				if (prof) map[id] = prof
			}
			setOwnerMap(map)
		}
		if (teams.length) run()
	}, [teams])

	const onCreate = async (e: FormEvent) => {
		e.preventDefault()
		if (!name.trim()) return
		setError(null)
		setSubmitting(true)
		try {
			await createNewTeam(name.trim())
			setName('')
		} catch (err: any) {
			setError(err?.message || 'Failed to create team')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="page-container">
			<div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
				{/* Header with Back Navigation and Centered Title - Responsive */}
				<div className="relative mb-6">
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
						<h1 className="text-xl sm:text-2xl font-semibold gradient-text">Your Workspaces</h1>
					</div>
				</div>
				<form onSubmit={onCreate} className="card space-y-3">
					<h2 className="font-medium">Create a new workspace</h2>
					{error && <div className="text-sm text-red-600">{error}</div>}
					<div className="flex gap-2">
						<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name" className="flex-1 input-modern" />
						<button disabled={submitting} className="btn-primary">{submitting ? 'Creating...' : 'Create'}</button>
					</div>
				</form>

				<div className="card">
					<div className="p-1 pb-4 font-medium">Your teams</div>
					{loading ? (
						<div className="p-4">Loading...</div>
					) : (
						<ul>
							{teams.map((t) => (
								<li key={t.id} className="flex items-center justify-between p-4 border-t border-white/40 card-hover">
									<div>
										<div className="font-medium">{t.name}</div>
										<div className="text-xs text-gray-500">Owner: {ownerMap[t.ownerId]?.name || ownerMap[t.ownerId]?.email || t.ownerId}</div>
									</div>
									<div className="flex items-center gap-3">
										{currentTeamId === t.id ? (
											<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-700 text-xs font-semibold border border-green-400/30">
												<div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></div>
												Active
											</span>
										) : (
											<button onClick={() => switchTeam(t.id)} className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 backdrop-blur-sm rounded-xl border border-blue-300/30 hover:border-blue-400/50 transition-all duration-300 text-sm">
												<span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Switch</span>
												<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
												</svg>
											</button>
										)}
										<Link to={`/teams/${t.id}`} className="group inline-flex items-center gap-2 px-4 py-2 bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-xl border border-white/40 hover:border-white/70 transition-all duration-300 text-sm">
											<span className="font-semibold text-gray-700 group-hover:text-gray-900">Manage</span>
											<svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</Link>
									</div>
								</li>
							))}
							{teams.length === 0 && <li className="p-4 text-sm text-gray-600">No workspaces yet.</li>}
						</ul>
					)}
				</div>
			</div>
		</div>
	)
}
