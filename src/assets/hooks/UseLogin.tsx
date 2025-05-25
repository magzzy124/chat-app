import { useMutation } from "@tanstack/react-query";
import { login } from "../services/api.ts";

export function useLogin(
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
) {
  return useMutation({
    mutationFn: ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => login(username, password),
    onSuccess,
    onError,
  });
}
