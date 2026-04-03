import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function Home() {
  const session = await getSession()

  if (session) {
    if (session.role === 'ADMIN') redirect('/admin')
    if (session.role === 'KITCHEN') redirect('/kitchen')
    redirect('/waiter')
  }

  redirect('/login')
}
