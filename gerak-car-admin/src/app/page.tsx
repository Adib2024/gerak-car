import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from public.users to determine role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Fallback if role is not found
    redirect('/login')
  }

  // Dynamic Role-Based Routing
  if (profile.role === 'admin') {
    redirect('/admin')
  } else if (profile.role === 'driver') {
    redirect('/driver')
  } else {
    // Default fallback is customer
    redirect('/customer')
  }
}
