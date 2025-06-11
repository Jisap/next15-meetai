"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,                                   // Array de objetos ColumnDef<TData, TValue>[] que define la estructura y el renderizado de cada columna.   
  data,                                      // Array TData[] con los datos que se mostrarán en la tabla.
  onRowClick,                                // Función callback que se ejecuta cuando se hace clic en una fila, recibiendo los datos de esa fila (row.original).
}: DataTableProps<TData, TValue>) {

  const table = useReactTable({              // Instancia de la tabla de ReactTable
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),      // Obtiene el modelo de fila básico de ReactTable
  })

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <Table>
        <TableBody>
          {table.getRowModel().rows?.length ? (                                     // Si la tabla tiene filas,
            table.getRowModel().rows.map((row) => (                                 // se itera sobre ellas
              <TableRow                                                             // para renderizar cada fila
                key={row.id}
                onClick={() => onRowClick?.(row.original)} // Si existe onRowClick, se ejecuta con el dato seleccionado en su interior -> redirect to meetingId page
                data-state={row.getIsSelected() && "selected"}
                className="cursor-pointer"
              >
                {row.getVisibleCells().map((cell) => (                               // Dentro de cada fila, se itera sobre las celdas que deben ser visibles segun la definición de ColumDef
                  <TableCell key={cell.id} className="text-sm p-4">      
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-19 text-center text-muted-foreground">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

      </Table>
    </div>
  )
}