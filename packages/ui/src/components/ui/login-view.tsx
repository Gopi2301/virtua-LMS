import * as React from "react"
import { ShieldCheck, Lock, ArrowRight, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { cn } from "../../lib/utils"

export interface FeatureItem {
  icon?: React.ReactNode
  title: string
  description: string
}

export interface LoginViewProps {
  portalTitle: string
  portalSubtitle: string
  badgeText: string
  badgeVariant?: "default" | "secondary" | "outline" | "success" | "warning" | "info"
  description: string
  features: FeatureItem[]
  onLogin: () => void
  loginButtonText?: string
  loading?: boolean
  realmName?: string
  footerNote?: string
  className?: string
}

export const LoginView: React.FC<LoginViewProps> = ({
  portalTitle,
  portalSubtitle,
  badgeText,
  badgeVariant = "default",
  description,
  features,
  onLogin,
  loginButtonText = "Sign In with Keycloak SSO",
  loading = false,
  realmName = "virtualogin",
  footerNote = "Secured via OpenID Connect (PKCE S256) &bull; Keycloak Unified Authentication",
  className,
}) => {
  return (
    <div
      className={cn(
        "relative flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-4 md:p-8 overflow-hidden",
        className
      )}
    >
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Brand & Value propositions */}
        <div className="lg:col-span-7 flex flex-col space-y-6 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#F3E700] text-black font-extrabold text-2xl">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {portalTitle}
                </span>
                <Badge variant={badgeVariant} className="text-[11px] uppercase tracking-wider">
                  {badgeText}
                </Badge>
              </div>
              <p className="text-xs text-[#b3b3b3] font-medium tracking-wide">
                {portalSubtitle}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Learn with confidence.
            </h1>
            <p className="text-[#b3b3b3] text-base md:text-lg max-w-xl leading-relaxed">
              {description}
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="group flex flex-col space-y-1.5 rounded-md border border-[#272727] bg-[#181818] p-4 transition-colors hover:border-[#4d4d4d] hover:bg-[#1f1f1f]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1f1f1f] text-[#F3E700] border border-[#3a3a3a]">
                    {feat.icon || <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    {feat.title}
                  </h4>
                </div>
                <p className="text-xs text-[#7c7c7c] pl-9 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-[#7c7c7c] pt-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Enterprise Grade SSO</span>
            </div>
            <div className="h-3 w-[1px] bg-[#3a3a3a]" />
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#539df5]" />
              <span>JWT & Role Synced</span>
            </div>
            <div className="h-3 w-[1px] bg-[#3a3a3a]" />
            <div className="flex items-center gap-1.5">
              <span>Zero password storage</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Login Card */}
        <div className="lg:col-span-5 w-full flex justify-center">
          <Card className="w-full max-w-md border-[#3a3a3a] bg-[#181818] relative overflow-hidden">
            <CardHeader className="text-center pb-4 pt-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-[#1f1f1f] border border-[#3a3a3a]">
                <Lock className="h-6 w-6 text-[#F3E700]" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Account Sign In
              </CardTitle>
              <CardDescription className="text-xs text-[#b3b3b3]">
                Authenticate with your unified Virtua credentials to access your session.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-2 pb-6">
              <div className="rounded-md border border-[#272727] bg-[#121212] p-3.5 text-xs text-[#b3b3b3] space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#7c7c7c]">Identity Provider:</span>
                  <span className="font-mono text-white font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Keycloak SSO
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#7c7c7c]">Target Realm:</span>
                  <span className="font-mono text-[#F3E700] bg-[#1f1f1f] px-2 py-0.5 rounded border border-[#3a3a3a]">
                    {realmName}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={onLogin}
                  disabled={loading}
                  className="w-full h-12 text-sm group"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {loginButtonText}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#272727]" />
                </div>
                <span className="relative bg-[#181818] px-3 text-[11px] text-[#7c7c7c] uppercase tracking-wider">
                  Secure Protocol
                </span>
              </div>

              <div
                className="text-[11px] text-center text-[#7c7c7c] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: footerNote }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
