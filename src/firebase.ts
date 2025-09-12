import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Consider moving these to environment variables for production builds
const firebaseConfig = {
	apiKey: 'AIzaSyBbwneMaJoPCLKYNBP0oMtuSS49pCNcfq4',
	authDomain: 'team-collab-kanban-board.firebaseapp.com',
	projectId: 'team-collab-kanban-board',
	storageBucket: 'team-collab-kanban-board.firebasestorage.app',
	messagingSenderId: '429666948952',
	appId: '1:429666948952:web:c11ef1d1b3d2c60f2df72d',
	measurementId: 'G-W5Q0PRQDJN',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)


