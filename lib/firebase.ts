import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore'

const hasFirebaseConfig = 
  !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
     process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && 
     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)

if (!hasFirebaseConfig && typeof window !== 'undefined') {
  console.warn("⚠️ Firebase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.")
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key-prevent-crash",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
}

// Next.js SSR 환경에서 중복 초기화 방지
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)

let firestoreDb
if (typeof window !== 'undefined') {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    })
  } catch (e) {
    firestoreDb = getFirestore(app)
  }
} else {
  firestoreDb = getFirestore(app)
}

export const db = firestoreDb
