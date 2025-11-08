'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, User, LogOut, Settings, Package, Heart, Mail, Info, Shield, ArrowRight } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useUIStore } from '@/stores/ui-store'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function NavigationDrawer() {
  const t = useTranslations('common')
  const tNav = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { isNavDrawerOpen, closeNavDrawer } = useUIStore()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
  }, [supabase])

  const switchLocale = (newLocale: string) => {
    const newPath = pathname?.replace(`/${locale}`, `/${newLocale}`) || `/${newLocale}`
    router.push(newPath)
    closeNavDrawer()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
    closeNavDrawer()
  }

  const handleLinkClick = () => {
    closeNavDrawer()
  }

  const isActive = (path: string) => {
    return pathname?.includes(path)
  }

  const localePrefix = pathname?.split('/')[1] || locale

  return (
    <Drawer open={isNavDrawerOpen} onOpenChange={(open) => !open && closeNavDrawer()} direction="left">
      <DrawerContent
        className="fixed inset-y-0 left-0 right-auto top-0 bottom-0 z-50 h-full w-80 max-w-[85vw] flex flex-col rounded-none border-r bg-background mt-0 [&>div:first-child]:hidden"
      >
        <DrawerHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">j</span>
              </div>
              <DrawerTitle className="text-xl font-bold text-primary">jufoods</DrawerTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={closeNavDrawer} className="rounded-full hover:bg-primary/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Language Switcher */}
          <div className="space-y-3">
            <ToggleGroup
              type="single"
              value={locale}
              onValueChange={(value) => value && switchLocale(value)}
              className="w-full grid grid-cols-2 gap-2 bg-muted/50 p-1 rounded-lg"
            >
              <ToggleGroupItem
                value="de"
                aria-label="Deutsch"
                className={cn(
                  'flex-1 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-4 py-2.5',
                  locale === 'de' && 'bg-background shadow-sm'
                )}
              >
                <span className="text-sm font-medium">Deutsch</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="uk"
                aria-label="Українська"
                className={cn(
                  'flex-1 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-4 py-2.5',
                  locale === 'uk' && 'bg-background shadow-sm'
                )}
              >
                <span className="text-sm font-medium">Українська</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 w-full">
            <Link
              href={`/${localePrefix}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full',
                isActive('/') && !isActive('about') && !isActive('contact') && !isActive('admin')
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={handleLinkClick}
            >
              <Package className="h-4 w-4" />
              {tNav('catalog')}
            </Link>
            <Link
              href={`/${localePrefix}/favorites`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full',
                isActive('favorites')
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={handleLinkClick}
            >
              <Heart className="h-4 w-4" />
              {t('favorites')}
            </Link>
            <Link
              href={`/${localePrefix}/about`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full',
                isActive('about')
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={handleLinkClick}
            >
              <Info className="h-4 w-4" />
              {tNav('about')}
            </Link>
            <Link
              href={`/${localePrefix}/contact`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full',
                isActive('contact')
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={handleLinkClick}
            >
              <Mail className="h-4 w-4" />
              {tNav('contact')}
            </Link>
            <Link
              href={`/${localePrefix}/admin`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full',
                isActive('admin')
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={handleLinkClick}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          </nav>
        </div>

        {/* Footer with Avatar */}
        <div className="border-t border-primary/10 bg-background p-4">
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <div className="text-sm text-muted-foreground">{t('loading')}</div>
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-accent">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate">{user.email?.split('@')[0]}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <DropdownMenuItem asChild>
                  <Link href={`/${localePrefix}/account`} onClick={handleLinkClick} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t('account')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${localePrefix}/orders`} onClick={handleLinkClick} className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {t('myOrders')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-accent">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium">
                        {locale === 'uk' ? 'Гість' : 'Gast'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {locale === 'uk' ? 'Увійти або зареєструватися' : 'Anmelden oder registrieren'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <DropdownMenuItem asChild>
                  <Link href={`/${localePrefix}/login`} onClick={handleLinkClick} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('login')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${localePrefix}/register`} onClick={handleLinkClick} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('register')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

