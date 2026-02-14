"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Minimal debounce hook if not exists, but I will assume I need to implement it or use a simple timeout
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface ContributorComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  className?: string;
}

export function ContributorCombobox({
  value,
  onChange,
  onSelect,
  className,
}: ContributorComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const debouncedSearch = useDebounceValue(search, 300);

  React.useEffect(() => {
    if (!open) return;
    
    // Fetch logic
    const fetchContributors = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        const res = await fetch(`/api/contributors?${params}`);
        if (res.ok) {
          const names = await res.json();
          setItems(names);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchContributors();
  }, [debouncedSearch, open]);

  const handleSelect = (currentValue: string) => {
    onChange(currentValue);
    onSelect?.(currentValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800", className)}
        >
          {value || "Select or type name..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-900 border-slate-800">
        <Command className="bg-slate-900 border-slate-800">
          <CommandInput
            placeholder="Search contributor..."
            value={search}
            onValueChange={setSearch}
            className="text-white placeholder:text-slate-500"
          />
          <CommandList className="max-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              </div>
            ) : (
              <>
                <CommandEmpty className="py-2 px-4 text-sm text-slate-500">
                   <button 
                     className="text-indigo-400 hover:text-indigo-300 w-full text-left"
                     onClick={() => handleSelect(search)}
                   >
                     Create "{search}"
                   </button>
                </CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item}
                      value={item}
                      onSelect={handleSelect}
                      className="text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
