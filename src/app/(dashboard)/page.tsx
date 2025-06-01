import { auth } from '@/lib/auth'
import { HomeView } from '@/modules/home/ui/views/home-view'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'

const Page = async() => {

  const session = await auth.api.getSession({ // Cuando se hace login, se guarda la sesión en la cookie
    headers: await headers()                  // Los headers acceden a la cookie y con ella se obtiene la sesión
  })

  if(!session) {
    redirect('/sign-in')
  }

  return (
    <HomeView />
  )
}

export default Page