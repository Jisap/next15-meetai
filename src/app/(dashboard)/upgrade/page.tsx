import { auth } from "@/lib/auth"
import { getQueryClient, trpc } from "@/trpc/server"
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  UpgradeView,
  UpgradeViewError,
  UpgradeViewLoading
} from "@/modules/premium/ui/views/upgrade-view";

const Page = async() => {

  const session = await auth.api.getSession({            // Cuando se hace login, se guarda la sesión en la cookie
    headers: await headers()                             // Los headers acceden a la cookie y con ella se obtiene la sesión
  })

  if (!session) {
    redirect('/sign-in')
  }

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.premium.getCurrentSubscription.queryOptions() // Prefetch del producto actualmente activado en polar perteneciente al usuario logueado
  )
  void queryClient.prefetchQuery(
    trpc.premium.getProducts.queryOptions()            // Prefetch de todos los productos disponibles en polar
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<UpgradeViewLoading />}>
        <ErrorBoundary fallback={<UpgradeViewError />}>
          <UpgradeView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  )
}

export default Page