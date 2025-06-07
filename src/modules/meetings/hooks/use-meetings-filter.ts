

import { DEFAULT_PAGE } from "@/constants";
import { parseAsInteger, parseAsString, useQueryStates, parseAsStringEnum } from "nuqs";
import { MeetingStatus } from "../types";

// Establece el estado y la configuración de los filtros en la url
export const useMeetingsFilter = () => {
  return useQueryStates({
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({ clearOnDefault: true }),
    status: parseAsStringEnum(Object.values(MeetingStatus)),
    agentId: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  })
}