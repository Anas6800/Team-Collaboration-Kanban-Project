import { type FormEvent, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { type Team, inviteMemberByEmail } from '../services/teams'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { getUsersByIds, getUserById, type UserProfile } from '../services/users'
import { useTeam } from '../context/TeamContext'

export default function TeamDetail() {
	const { teamId } = useParams()
	const navigate = useNavigate()
	const { canManageTeam, deleteCurrentTeam } = useTeam()
	const [team, setTeam] = useState<Team | null>(null)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({})
	const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null)

	useEffect(() => {
		const run = async () => {
			if (!teamId) return
			const ref = doc(db, 'teams', teamId)
			const snap = await getDoc(ref)
			if (snap.exists()) {
				const teamData = { id: snap.id, ...(snap.data() as any) }
				console.log('Team data:', teamData)
				setTeam(teamData)
			}
		}
		run()
	}, [teamId])

	useEffect(() => {
		const run = async () => {
			if (!team) return
			const members = team.members || []
			console.log('Team members:', members)
			const profs = await getUsersByIds(members)
			console.log('Member profiles:', profs)
			setMemberProfiles(profs)
			const owner = await getUserById(team.ownerId)
			console.log('Owner profile:', owner)
			setOwnerProfile(owner)
		}
		run()
	}, [team?.id, team?.members?.length])

	const onInvite = async (e: FormEvent) => {
		e.preventDefault()
		if (!teamId) return
		setMessage(null)
		setError(null)
		setLoading(true)
		try {
			const res = await inviteMemberByEmail(teamId, email.trim())
			if (res === 'not_found') setError('User not found')
			else if (res === 'already_member') setMessage('User is already a member')
			else setMessage('Member invited/added')
		} catch (err: any) {
			setError(err?.message || 'Failed to invite')
		} finally {
			setLoading(false)
		}
	}

	const handleDeleteTeam = async () => {
		setDeleting(true)
		try {
			await deleteCurrentTeam()
			navigate('/teams')
		} catch (error) {
			console.error('Failed to delete team:', error)
			alert('Failed to delete team. Please try again.')
		} finally {
			setDeleting(false)
			setShowDeleteConfirm(false)
		}
	}

	return (
		<div className="page-container">
			<div className="max-w-3xl mx-auto p-6 space-y-6">
				{/* Header with navigation and role */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Link 
							to="/teams" 
							className="group inline-flex items-center gap-3 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 hover:border-white/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
						>
							<div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white text-xs font-semibold group-hover:scale-110 transition-transform duration-300">
								<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
							</div>
							<span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
								Back to Teams
							</span>
						</Link>
						<h1 className="text-2xl font-semibold gradient-text">Team Management</h1>
					</div>
					{team && (
						<div className="flex items-center gap-3">
							<div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
								canManageTeam(teamId) 
									? 'bg-purple-50 text-purple-700 border border-purple-200'
									: 'bg-blue-50 text-blue-700 border border-blue-200'
							}`}>
								{canManageTeam(teamId) ? '👑 Owner' : '👤 Member'}
							</div>
							{canManageTeam(teamId) && (
								<button
									onClick={() => setShowDeleteConfirm(true)}
									className="btn-danger"
								>
									Delete Team
								</button>
							)}
						</div>
					)}
				</div>
				{!team ? (
					<div>Loading...</div>
				) : (
					<div className="space-y-6">
						<div className="card">
							<div className="font-medium">{team.name || team.memberInfo?.[team.ownerId]?.name || 'Workspace'}</div>
							<div className="text-xs text-gray-500">Owner: {ownerProfile?.name || ownerProfile?.email || team.memberInfo?.[team.ownerId]?.name || team.memberInfo?.[team.ownerId]?.email || team.ownerId}</div>
						</div>
						<div className="card">
							<div className="p-1 pb-4 font-medium">Members</div>
							<ul>
								{team.members?.map((m) => (
									<li key={m} className="p-3 border-t border-white/40 text-sm">{memberProfiles[m]?.name || memberProfiles[m]?.email || team.memberInfo?.[m]?.name || team.memberInfo?.[m]?.email || m}</li>
								))}
								{team.members?.length === 0 && <li className="p-3 text-sm text-gray-600">No members</li>}
							</ul>
						</div>

						{canManageTeam(teamId) ? (
							<form onSubmit={onInvite} className="card space-y-3">
								<h2 className="font-medium">Invite by email</h2>
								{message && <div className="text-green-700 text-sm">{message}</div>}
								{error && <div className="text-red-600 text-sm">{error}</div>}
								<div className="flex gap-2">
									<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="flex-1 input-modern" />
									<button disabled={loading} className="btn-primary">{loading ? 'Inviting...' : 'Invite'}</button>
								</div>
							</form>
						) : (
							<div className="card">
								<div className="text-center py-8">
									<div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
										<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
									<h3 className="text-lg font-semibold text-gray-700 mb-2">Team Management Restricted</h3>
									<p className="text-gray-500 text-sm">Only team owners can invite new members and manage team settings.</p>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Delete Team Confirmation Modal */}
				{showDeleteConfirm && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="card w-full max-w-md">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-lg font-semibold text-red-600">Delete Team</h2>
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
									This will permanently delete <strong>"{team?.name}"</strong> and all its:
								</p>
								<ul className="text-sm text-gray-600 ml-4 space-y-1">
									<li>• All boards and their data</li>
									<li>• All tasks and assignments</li>
									<li>• All team member access</li>
									<li>• All workspace history</li>
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
									onClick={handleDeleteTeam}
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
		</div>
	)
}
