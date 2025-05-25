import { useQuery } from "@tanstack/react-query";
import { getUserMessages } from "../services/api.ts";

export function useGetUserMessages(friendName: string) {
  return useQuery({
    queryKey: ["allPeople", friendName],
    queryFn: () => getUserMessages(friendName),
    enabled: false,
  });
}
