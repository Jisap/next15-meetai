import { auth } from '@/lib/auth';
import { loadSearchParams } from '@/modules/meetings/params';
import { MeetingsListHeader } from '@/modules/meetings/ui/components/meetings-list-header';
import { MeetingsView, MeetingsViewError, MeetingsViewLoading } from '@/modules/meetings/ui/views/meetings-view'
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { SearchParams } from 'nuqs';

interface Props {
  searchParams: Promise<SearchParams>                    // Parámetros de la url
}

const Page = async({ searchParams }: Props) => {

  const filters = await loadSearchParams(searchParams)   // Parsea y valida los parámetros de la URL usando la configuración definida en `loadSearchParams` con nuqs

  const session = await auth.api.getSession({            // Cuando se hace login, se guarda la sesión en la cookie
    headers: await headers()                             // Los headers acceden a la cookie y con ella se obtiene la sesión
  })

  if (!session) {
    redirect('/sign-in')
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.meetings.getMany.queryOptions({...filters}));

  return (
    <>
      <MeetingsListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<MeetingsViewLoading />}>
          <ErrorBoundary fallback={<MeetingsViewError />}>
            <MeetingsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>  
    </>
  )
}

export default Page