import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/app/actions/notifications'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await getNotifications(session.user.id)
    const unreadCount = await getUnreadCount(session.user.id)

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('[Notifications API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationId } = body

    if (action === 'markRead' && notificationId) {
      await markAsRead(notificationId, session.user.id)
      return NextResponse.json({ success: true })
    }

    if (action === 'markAllRead') {
      await markAllAsRead(session.user.id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Notifications API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

