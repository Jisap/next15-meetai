"use client"

import { ErrorState } from "@/components/error-state"
import { LoadingState } from "@/components/loading-state"
import { authClient } from "@/lib/auth-client"
import { useTRPC } from "@/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"
import { PricingCard } from "../components/pricing-card"


export const UpgradeViewLoading = () => {
  return (
    <LoadingState 
      title="Loading" 
      description="This may take a few seconds"
    />
  )
}

export const UpgradeViewError = () => {
  return <ErrorState 
    title="Error"
    description="Please try again later"
  />
}

export const UpgradeView = () => {

  const trpc = useTRPC();

  const productsQueryOptions = trpc.premium.getProducts.queryOptions();
  const { data: products } = useSuspenseQuery({                                 // Obtenemos todos los productos disponibles en polar
    ...productsQueryOptions,
    retry: 3,
  })
 

  const currentQueryOptions = trpc.premium.getCurrentSubscription.queryOptions();
  const { data: currentSubscription } = useSuspenseQuery({                      // Obtiene la subs activa. (Si no hay subs es plan free devuelve null y se aplican limites de us0. 
    ...currentQueryOptions,
    retry: 3,
  })
 


  return (
    <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-10">
      <div className="mt-4 flex-1 flex flex-col gap-y-10 items-center">
        <h5 className="font-medium text-3xl md:text-3xl">
          You are on the{" "}
          <span className="font-semibold text-primary">
            {currentSubscription?.name ?? "Free"}
          </span>{" "}
          plan
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => {
            const isCurrentProduct = currentSubscription?.id === product.id;    // Subscripción actual del usuario
            const isPremium = !!currentSubscription;                            // Si el usuario tiene una subscripción activa entonces es premium (true) -> no se aplican los límites de uso gratuitos
            let buttonText = "Upgrade";
            let onClick = () => authClient.checkout({ products: [product.id]})  // Se abre el checkout de polar

            
            if (isCurrentProduct) {                                             // El usuario ya tiene este plan, ofrecer gestión de suscripción                       
              buttonText = "Manage"
              onClick = () => authClient.customer.portal()
            
            } else if (isPremium) {                                             // El usuario es premium pero no tiene este plan, ofrecer cambio de plan                        
              buttonText = "Change Plan"
              onClick = () => authClient.customer.portal()
            }

            // Si ninguna de las anteriores es cierta, el usuario no es premium (plan gratuito) 
            // -> Se usa el comportamiento por defecto: buttonText="Upgrade"
            return (
              <PricingCard 
                key={product.id}
                buttonText={buttonText}
                onClick={onClick}
                variant={
                  product.metadata.variant === "highlighted"
                    ? "highlighted"
                    : "default"
                }
                title={product.name}
                price={
                  product.prices[0].amountType === "fixed"
                    ? product.prices[0].priceAmount / 100
                    : 0
                }
                description={product.description}
                priceSuffix={`/${product.prices[0].recurringInterval}`}
                features={product.benefits.map(
                  (benefit) => benefit.description
                )}
                badge={product.metadata.badge as string | null}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

