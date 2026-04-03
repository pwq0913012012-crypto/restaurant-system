'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await res.json()
      if (result.success) {
        const role = result.data.user.role
        if (role === 'ADMIN') router.push('/admin')
        else if (role === 'KITCHEN') router.push('/kitchen')
        else router.push('/waiter')
      } else {
        toast.error(result.error || '登入失敗')
      }
    } catch {
      toast.error('網路錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent">美味餐廳</h1>
          <p className="text-muted mt-2">員工登入</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">電子郵件</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent text-background font-bold hover:bg-accent-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
      </div>
    </div>
  )
}
