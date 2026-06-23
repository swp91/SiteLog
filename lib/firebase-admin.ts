import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
// 환경변수에 저장된 \n 문자열을 실제 줄바꿈 문자로 치환합니다.
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined

if (getApps().length === 0) {
  if (projectId && clientEmail && privateKey && clientEmail !== 'YOUR_FIREBASE_ADMIN_CLIENT_EMAIL') {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  } else {
    // 환경변수가 완전히 채워지기 전 빌드 단계나 초기 설정 대기 시 경고만 출력합니다.
    console.warn(
      'Firebase Admin SDK credentials are not configured yet. Firebase Admin features will not work until credentials are provided.'
    )
  }
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()

