import { useMutation } from "@tanstack/react-query";
import { loginAsGuest } from "../services/api.ts";

export function useLoginGuest(
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
) {
  return useMutation({
    mutationFn: () => loginAsGuest(),
    onSuccess,
    onError,
  });
}
