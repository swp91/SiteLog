import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 })
    }

    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: 'Kakao environment variables are not configured' }, { status: 500 })
    }

    // 1. 카카오 토큰 교환
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Kakao token exchange failed:', errorData)
      return NextResponse.json({ error: 'Failed to exchange Kakao token', details: errorData }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // 2. 카카오 사용자 정보 조회
    const userMeResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    })

    if (!userMeResponse.ok) {
      const errorData = await userMeResponse.json()
      console.error('Kakao user/me failed:', errorData)
      return NextResponse.json({ error: 'Failed to get Kakao user profile', details: errorData }, { status: 400 })
    }

    const kakaoUser = await userMeResponse.json()
    const kakaoId = kakaoUser.id
    const nickname = kakaoUser.properties?.nickname || 'Kakao User'
    const email = kakaoUser.kakao_account?.email || ''
    const photoURL = kakaoUser.properties?.profile_image || ''

    // Firebase UID 정의
    const firebaseUid = `kakao:${kakaoId}`

    // 3. Firebase Auth 사용자 조회 또는 생성
    try {
      await adminAuth.getUser(firebaseUid)
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // 존재하지 않는 유저인 경우 신규 생성
        await adminAuth.createUser({
          uid: firebaseUid,
          email: email || undefined,
          displayName: nickname,
          photoURL: photoURL || undefined,
        })
      } else {
        throw error
      }
    }

    // 4. Firestore에 유저 기본 문서가 없는 경우 생성
    const userDocRef = adminDb.collection('users').doc(firebaseUid)
    const userDoc = await userDocRef.get()
    
    if (!userDoc.exists) {
      await userDocRef.set({
        name: nickname,
        email: email,
        type: 'manager', // 기본 회원 타입은 관리자로 셋업
        joined: new Date().toISOString().slice(0, 7)
      })
    }

    // 5. Firebase Custom Token 생성
    const customToken = await adminAuth.createCustomToken(firebaseUid)

    return NextResponse.json({ token: customToken })
  } catch (error: any) {
    console.error('Kakao auth API error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}
