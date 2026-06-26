'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Loader2, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const features = [
  'Natural language queries over ILI, SCADA, and PHMSA datasets',
  'Human-in-the-Loop review gates for every safety-critical recommendation',
  'Immutable audit trail for regulatory compliance and traceability',
]

export default function LoginPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setAuthError(null)
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })
    if (result?.error) {
      setAuthError('Invalid email or password. Contact your system administrator.')
    } else {
      router.push('/chat')
    }
  }

  return (
    <div className="min-h-screen flex bg-[#050D1A]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden pipeline-pattern">
        {/* Decorative pipeline rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#1C2E4A] opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-[#2A4270] opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-[#1D6FD9] opacity-10" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[#1D6FD9]/20 border border-[#1D6FD9]/40 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#1D6FD9]" />
            </div>
            <span className="text-2xl font-semibold">
              <span className="text-[#8B9BB4] font-normal">Pipeline</span>
              <span className="text-[#1D6FD9] font-bold">GPT</span>
            </span>
          </div>

          <h1 className="text-4xl font-bold text-[#E8EDF4] leading-tight tracking-tight mb-4">
            AI-Powered Pipeline<br />Integrity Intelligence
          </h1>
          <p className="text-[#8B9BB4] text-lg mb-10 leading-relaxed">
            Query decades of inspection data, ILI reports, and PHMSA incident records
            using plain English — with every recommendation reviewed by your engineers.
          </p>

          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#1D6FD9] mt-0.5 shrink-0" />
                <span className="text-[#8B9BB4] text-sm leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-16 pt-8 border-t border-[#1C2E4A] flex items-center gap-6">
            <span className="text-xs text-[#4A5A72]">Submitted to</span>
            <span className="text-xs font-semibold text-[#8B9BB4]">ASME Foundation</span>
            <span className="text-xs text-[#4A5A72]">·</span>
            <span className="text-xs font-semibold text-[#8B9BB4]">ROSEN Group</span>
            <span className="text-xs text-[#4A5A72]">· Hermann Rosen Award 2026</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Activity className="w-6 h-6 text-[#1D6FD9]" />
            <span className="text-xl font-semibold">
              <span className="text-[#8B9BB4] font-normal">Pipeline</span>
              <span className="text-[#1D6FD9] font-bold">GPT</span>
            </span>
          </div>

          <div className="bg-[#0A1628] border border-[#1C2E4A] rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-[#E8EDF4] mb-1">Sign in</h2>
            <p className="text-sm text-[#8B9BB4] mb-6">
              Enter your credentials to access the pipeline intelligence platform.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="engineer@operator.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-[#DC2626]">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-[#DC2626]">{errors.password.message}</p>
                )}
              </div>

              {authError && (
                <div className="rounded-lg border border-[#DC2626]/30 bg-[rgba(220,38,38,0.08)] p-3 text-sm text-[#DC2626]">
                  {authError}
                </div>
              )}

              <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-[#4A5A72]">
              For authorized personnel only. Access is logged and audited.
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#4A5A72]">
              2026 Hermann Rosen Award for Pipeline Innovation ·{' '}
              <span className="text-[#8B9BB4]">ASME Foundation</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
