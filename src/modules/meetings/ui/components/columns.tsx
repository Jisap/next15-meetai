"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MeetingGetMany } from '../../types';
import { GeneratedAvatar } from "@/components/generated-avatar"
import {  
  CircleCheckIcon,
  CircleXIcon,
  ClockArrowUpIcon,
  ClockFadingIcon,
  CornerDownRightIcon,
  LoaderIcon,
 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns";
import humanizeDuration from "humanize-duration";
import { cn } from "@/lib/utils";


function formatDuration(seconds: number) {
  return humanizeDuration(seconds * 1000, { 
    largest: 1,
    round: true, 
    units: ["h", "m", "s"], 
  })
}

const statusIconMap = {
  upcoming: ClockArrowUpIcon,
  active: LoaderIcon,
  completed: CircleCheckIcon,
  processing: LoaderIcon,
  cancelled: CircleXIcon
}

const statusColorMap = {
  upcoming: "bg-yellow-500/20 text-yellow-800 border-yellow-800/5",
  active: "bg-blue-500/20 text-blue-800 border-blue-800/5",
  completed: "bg-emerald-500/20 text-emerald-800 border-emerald-800/5",
  processing: "bg-gray-300/20 text-gray-800 border-gray-800/5",
  cancelled: "bg-rose-500/20 text-rose-800 border-rose-800/5",
}

// Cada objeto en el array columns definirá una columna para datos del tipo MeetingGetMany[number] (es decir, un objeto individual de reunión)
// Este array columns es una configuración declarativa que le dice a DataTable:
//   - Qué datos mostrar: a través de accessorKey (o accessorFn para datos derivados).
//   - Cómo llamar a la columna: a través de header.
//   - Cómo renderizar cada celda: a través de la función cell.
// El componente DataTable luego itera sobre estas definiciones para construir la estructura de la tabla y 
// renderizar las cabeceras y las celdas para cada fila de datos que le pases


export const columns: ColumnDef<MeetingGetMany[number]>[] = [ 
  {
    accessorKey: "name",
    header: "Meeting Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        {/* row.original es el objeto de datos completo para la fila actual */}
        <span className="font-semibold capitalize">{row.original.name}</span> 
        
        <div className="flex items-center gap-x-2">
          <div className="flex items-center gap-x-1">
            <CornerDownRightIcon className="size-3 text-muted-foreground"/>
            <span className="text-sm text-muted-foreground max-w-[200px] truncate capitalize">
              {row.original.agent.name}
            </span>

            <GeneratedAvatar 
              variant="botttsNeutral"
              seed={row.original.agent.name}
              className="size-4"
            />

            <span>
              {row.original.startedAt ? format(row.original.startedAt, "MMM d") : ""}
            </span>
          </div>
        </div>
      </div>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const Icon = statusIconMap[row.original.status as keyof typeof statusIconMap]; // Obtenemos el icono correspondiente al estado de la reunión
      return (
        <Badge
          variant="outline"
          className={cn(
            `capitalize [&>svg]:size-4 text-muted-foreground`,
            statusColorMap[row.original.status as keyof typeof statusColorMap]
          )}
        >
          <Icon 
            className={cn(
              row.original.status === "processing" && "animate-spin"
            )}
          />
          {row.original.status}
        </Badge>
      )
    }
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="capitalize [&>svg]:size-4 flex items-center gap-x-2"
      >
        <ClockFadingIcon className="text-blue-700" />
        {row.original.duration ? formatDuration(row.original.duration) : "No duration"}
      </Badge>
    )
  }
 
 
]