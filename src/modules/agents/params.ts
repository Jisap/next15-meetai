import { DEFAULT_PAGE } from "@/constants"
import { createLoader, parseAsInteger, parseAsString } from "nuqs/server"



// Esto es un objeto de configuración que define cómo se deben tratar ciertos parámetros de la URL
export const filtersSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({ clearOnDefault: true }),
}

// Extrae y valida los parámetros de la URL
export const loadSearchParams = createLoader(filtersSearchParams)