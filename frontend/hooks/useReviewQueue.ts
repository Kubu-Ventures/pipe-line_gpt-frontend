'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReviewQueue, submitDecision, type DecisionPayload } from '@/lib/api'
import { useSession } from 'next-auth/react'

export function useReviewQueue(status?: string) {
  const { data: session } = useSession()
  const token = session?.accessToken ?? ''

  return useQuery({
    queryKey: ['review-queue', status],
    queryFn: () => getReviewQueue(status, token),
    enabled: !!token,
    refetchInterval: 30_000,
  })
}

export function useSubmitDecision() {
  const { data: session } = useSession()
  const token = session?.accessToken ?? ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ queryId, payload }: { queryId: string; payload: DecisionPayload }) =>
      submitDecision(queryId, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] })
    },
  })
}
