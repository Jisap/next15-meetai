import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useMeetingsFilter } from "../../hooks/use-meetings-filter";


// Establece en la url el search

export const MeetingsSearchFilter = () => {

  const [filters, setFilters] = useMeetingsFilter(); // Establece el estado de filters desde la url

  return(
    <div className="relative">
      <Input 
        placeholder="Filter by name..."
        className="h-9 bg-white w-[200px] pl-7"
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })} // Input -> setFilters -> url modificada con ?search=value 
      />
      <SearchIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
    </div>
  )
}