import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getQueryClient, trpc } from '@/trpc/server';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { MeetingIdView, MeetingIdViewError, MeetingIdViewLoading } from '@/modules/meetings/ui/views/meeting-id-view';



interface Props {
  params: Promise<{ meetingId: string }>;
}

const Page = async({ params }: Props) => {

  const { meetingId } = await params;

  const session = await auth.api.getSession({            // Cuando se hace login, se guarda la sesión en la cookie
    headers: await headers()                             // Los headers acceden a la cookie y con ella se obtiene la sesión
  })

  if (!session) {
    redirect('/sign-in')
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.meetings.getOne.queryOptions({ id: meetingId }));
  
  //TODO: Prefetch `meetings.getTranscript`

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<MeetingIdViewLoading />}>
        <ErrorBoundary fallback={<MeetingIdViewError />}>
          <MeetingIdView meetingId={meetingId} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  )
}

export default Page