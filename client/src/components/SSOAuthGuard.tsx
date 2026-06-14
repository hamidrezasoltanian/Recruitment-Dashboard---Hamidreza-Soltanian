import { useEffect, useState, ReactNode } from 'react'
import { checkSSOAuth, redirectToMainLogin, handleSSORedirect, SSOUser } from '../utils/sso'

interface SSOAuthGuardProps {
  children: ReactNode
  required?: boolean
}

export default function SSOAuthGuard({ children, required = true }: SSOAuthGuardProps) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<SSOUser | null>(null)

  useEffect(() => {
    // Handle SSO redirect (if coming from main system)
    handleSSORedirect()

    // Check authentication
    const checkAuth = async () => {
      const result = await checkSSOAuth()
      setAuthenticated(result.authenticated)
      if (result.user) {
        setUser(result.user)
      }
      setLoading(false)

      if (required && !result.authenticated) {
        redirectToMainLogin()
      }
    }

    checkAuth()
  }, [required])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بررسی احراز هویت...</p>
        </div>
      </div>
    )
  }

  if (required && !authenticated) {
    return null // Will redirect to login
  }

  return <>{children}</>
}

