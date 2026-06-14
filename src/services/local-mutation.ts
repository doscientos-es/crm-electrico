type MutationOptions<TResult> = {
  onSuccess?: (result: TResult) => void
  onError?: (error: unknown) => void
}

export function localMutation<TInput, TResult>(handler: (input: TInput) => TResult) {
  return {
    isPending: false,
    isError: false,
    mutate(input: TInput, options?: MutationOptions<TResult>) {
      try {
        const result = handler(input)
        options?.onSuccess?.(result)
      } catch (error) {
        options?.onError?.(error)
      }
    },
  }
}
