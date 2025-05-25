import { useQuery } from "@tanstack/react-query";
import { getAllPeople } from "../services/api.ts";

export function useGetAllPeople(searchParam: string) {
  return useQuery({
    queryKey: ["allPeople", searchParam],
    queryFn: () => getAllPeople(searchParam),
  });
}
