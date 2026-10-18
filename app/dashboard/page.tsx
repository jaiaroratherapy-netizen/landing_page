import { redirect } from 'next/navigation'
import { getViewer, homeFor } from '@/lib/auth'

export default async function Dashboard() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  redirect(homeFor(viewer.role))
}
