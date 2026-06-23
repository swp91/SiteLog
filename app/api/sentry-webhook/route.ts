import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Sentry webhook payload 파싱 (안전한 옵셔널 체이닝 및 폴백 적용)
    const projectName = body.project_name || body.project || 'SiteLog'
    const message = body.message || (body.event && body.event.title) || '알 수 없는 이슈'
    const url = body.url || 'https://sentry.io'
    const culprit = (body.event && body.event.culprit) || body.culprit || '위치 불명'
    const level = body.level || 'error'

    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (!discordWebhookUrl) {
      console.error('DISCORD_WEBHOOK_URL 환경 변수가 설정되지 않았습니다.')
      return NextResponse.json({ error: 'Webhook config missing' }, { status: 500 })
    }

    // 디스코드 Embed 메세지 구조 빌드
    const payload = {
      username: 'Sentry 알리미',
      avatar_url: 'https://avatars.githubusercontent.com/u/1396951?s=200&v=4', // Sentry 아이콘
      embeds: [
        {
          title: `🚨 [${projectName}] 새로운 이슈 감지`,
          description: `**이슈 요약**\n\`\`\`text\n${message}\n\`\`\``,
          url: url,
          color: level === 'error' ? 0xE74C3C : 0xF1C40F, // 에러는 빨강, 워닝은 노랑
          fields: [
            {
              name: '발생 위치',
              value: `\`${culprit}\``,
              inline: false
            }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    }

    // 디코 채널로 POST 요청 전송
    const response = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Discord Webhook 전송 실패:', errorText)
      return NextResponse.json({ error: 'Discord send failed' }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Sentry Webhook 처리 중 오류:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
