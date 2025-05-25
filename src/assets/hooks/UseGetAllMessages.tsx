import { useMutation } from "@tanstack/react-query";
import { getMessages } from "../services/api.ts";

export function useGetAllMessages(username: string, onSuccess, onError) {
  return useMutation({
    mutationFn: () => getMessages(username),
    onSuccess,
    onError,
  });
}
