'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReviewQueue, submitDecision } from '@/lib/api'
import { useSession } from 'next-auth/react'

export function useReviewQueue(status: string = 'all') {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken

  return useQuery({
    queryKey: ['review-queue', status],
    queryFn: () => getReviewQueue(status, token),
    refetchInterval: 30_000,
    enabled: !!token,
  })
}

export function useSubmitDecision() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      queryId,
      decision,
    }: {
      queryId: string
      decision: { decision: 'APPROVE' | 'EDIT' | 'REJECT'; final_text?: string; reason?: string }
    }) => submitDecision(queryId, decision, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review-queue'] })
    },
  })
}
