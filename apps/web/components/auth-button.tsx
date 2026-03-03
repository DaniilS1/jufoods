'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User } from 'lucide-react'

export function AuthButton() {
  const t = useTranslations('common')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    supabase.auth
      .getUser()
      .then(({ data: { user }, error }) => {
        if (mounted) {
          if (error) {
            console.warn('Failed to get user:', error.message)
            setUser(null)
          } else {
            setUser(user)
          }
          setLoading(false)
        }
      })
      .catch((error) => {
        if (mounted) {
          console.warn('Auth error:', error.message)
          setUser(null)
          setLoading(false)
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return <Button variant="ghost" size="sm" disabled>{t('loading')}</Button>
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4 mr-2" />
            {user.email?.split('@')[0]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/account">{t('account')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/orders">{t('myOrders')}</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>{t('logout')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">{t('login')}</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/register">{t('register')}</Link>
      </Button>
    </div>
  )
}

