import { DEFAULT_PAGE } from "@/constants"
import { createLoader, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server"
import { MeetingStatus } from "./types"





/**
 * Define la estructura y los valores por defecto para los parámetros de búsqueda (filtros)
 * que se esperan en la URL. Esta configuración es utilizada por `nuqs/server` para
 * parsear los parámetros del lado del servidor.
 * - `search`: Parámetro para el texto de búsqueda, por defecto es una cadena vacía.
 * - `page`: Parámetro para la paginación, por defecto es `DEFAULT_PAGE`.
 * - `status`: Parámetro para el estado de la reunión, por defecto es `MeetingStatus.Upcoming`.
 * - `agentId`: Parámetro para el agentId, por defecto es una cadena vacía.
 * `withOptions({ clearOnDefault: true })` ayuda a mantener las URLs limpias al no incluir
 * parámetros si su valor es el predeterminado (relevante para la actualización de URL desde el cliente).
 */
export const filtersSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({ clearOnDefault: true }),
  status: parseAsStringEnum(Object.values(MeetingStatus)),
  agentId: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
}

/**
 * Crea una función (`loadSearchParams`) para cargar y parsear los parámetros de la URL
 * del lado del servidor, utilizando la configuración definida en `filtersSearchParams`.
 * Esta función se usa típicamente en Server Components de Next.js para obtener los filtros
 * iniciales de la URL y pasarlos al pre-cargado de datos (ej. con TanStack Query).
 * Es la contraparte en el servidor de `useMeetingsFilter` (que usa `useQueryStates` de `nuqs` en el cliente).
 */
export const loadSearchParams = createLoader(filtersSearchParams)