import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { type Team, createTeam, listUserTeams, deleteTeam } from '../services/teams'
import { getUsersByIds } from '../services/users'

export type TeamContextValue = {
	teams: Team[]
	currentTeamId: string | null
	loading: boolean
	refresh: () => Promise<void>
	switchTeam: (teamId: string) => void
	createNewTeam: (name: string) => Promise<string>
	deleteCurrentTeam: () => Promise<void>
	// Role-based permissions
	isOwner: (teamId?: string) => boolean
	isMember: (teamId?: string) => boolean
	canDeleteTasks: (teamId?: string) => boolean
	canManageTeam: (teamId?: string) => boolean
	// Team members
	teamMembers: any[]
	fetchTeamMembers: () => Promise<void>
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined)

export const TeamProvider = ({ children }: { children: React.ReactNode }) => {
	const { user } = useAuth()
	const [teams, setTeams] = useState<Team[]>([])
	const [currentTeamId, setCurrentTeamId] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [teamMembers, setTeamMembers] = useState<any[]>([])

	useEffect(() => {
		if (!user) {
			setTeams([])
			setCurrentTeamId(null)
			return
		}
		refresh()
	}, [user?.uid])

	const refresh = async () => {
		if (!user) return
		setLoading(true)
		try {
			const result = await listUserTeams(user.uid)
			setTeams(result)
			if (!currentTeamId && result.length > 0) setCurrentTeamId(result[0].id)
		} finally {
			setLoading(false)
		}
	}

	const switchTeam = (teamId: string) => {
		setCurrentTeamId(teamId)
	}

	const createNewTeam = async (name: string) => {
		if (!user) throw new Error('Not authenticated')
		const id = await createTeam(name, user.uid)
		await refresh()
		setCurrentTeamId(id)
		return id
	}

	const deleteCurrentTeam = async () => {
		if (!currentTeamId) throw new Error('No team selected')
		await deleteTeam(currentTeamId)
		// Reset current team and refresh
		setCurrentTeamId(null)
		await refresh()
	}

	// Role-based permission functions
	const isOwner = (teamId?: string) => {
		if (!user) return false
		const targetTeamId = teamId || currentTeamId
		if (!targetTeamId) return false
		const team = teams.find(t => t.id === targetTeamId)
		return team?.ownerId === user.uid
	}

	const isMember = (teamId?: string) => {
		if (!user) return false
		const targetTeamId = teamId || currentTeamId
		if (!targetTeamId) return false
		const team = teams.find(t => t.id === targetTeamId)
		return team ? (team.ownerId === user.uid || team.members?.includes(user.uid)) : false
	}

	const canDeleteTasks = (teamId?: string) => {
		// Only owners can delete tasks
		return isOwner(teamId)
	}

	const canManageTeam = (teamId?: string) => {
		// Only owners can manage team (invite/remove members, delete team)
		return isOwner(teamId)
	}
	
	// Fetch team members for the current team
	const fetchTeamMembers = async () => {
		if (!currentTeamId || !user) {
			setTeamMembers([])
			return
		}
		
		try {
			// Get the current team
			const currentTeam = teams.find(t => t.id === currentTeamId)
			if (!currentTeam || !currentTeam.members) {
				setTeamMembers([])
				return
			}
			
			// Fetch user profiles for all team members
			const memberProfiles = await getUsersByIds(currentTeam.members)
			
			// Create member objects with proper roles
			const members = currentTeam.members.map(memberId => {
				// Check if we have user profile data from Firebase
				const userProfile = memberProfiles[memberId]
				
				// If we have the profile, use it
				if (userProfile) {
					return {
						id: memberId,
						name: userProfile.name,
						email: userProfile.email,
						role: memberId === currentTeam.ownerId ? 'owner' : 'member'
					}
				}
				
				// Fallback: Check memberInfo stored in team document
				const memberInfo = currentTeam.memberInfo?.[memberId]
				if (memberInfo) {
					return {
						id: memberId,
						name: memberInfo.name || memberInfo.email?.split('@')[0] || 'Unknown User',
						email: memberInfo.email || 'No email',
						role: memberId === currentTeam.ownerId ? 'owner' : 'member'
					}
				}
				
				// Final fallback: Use the current user's data if it's them
				if (memberId === user.uid) {
					return {
						id: memberId,
						name: user.displayName || user.email?.split('@')[0] || 'You',
						email: user.email || '',
						role: memberId === currentTeam.ownerId ? 'owner' : 'member'
					}
				}
				
				// Last resort fallback
				return {
					id: memberId,
					name: 'Unknown User',
					email: 'No email available',
					role: memberId === currentTeam.ownerId ? 'owner' : 'member'
				}
			}).filter(member => member !== null) // Remove any null entries
			
			setTeamMembers(members)
		} catch (error) {
			console.error('Failed to fetch team members:', error)
			setTeamMembers([])
		}
	}

	const value = useMemo(
		() => ({ 
			teams, 
			currentTeamId, 
			loading, 
			refresh, 
			switchTeam, 
			createNewTeam,
			deleteCurrentTeam,
			isOwner,
			isMember,
			canDeleteTasks,
			canManageTeam,
			teamMembers,
			fetchTeamMembers
		}),
		[teams, currentTeamId, loading, user?.uid, teamMembers]
	)

	return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export const useTeam = () => {
	const ctx = useContext(TeamContext)
	if (!ctx) throw new Error('useTeam must be used within TeamProvider')
	return ctx
}
