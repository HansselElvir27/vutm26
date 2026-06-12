'use client'

import { useLanguage } from '@/lib/language-context'

interface TranslatedContentProps {
  children: (t: (key: string) => string) => React.ReactNode
}

export function TranslatedContent({ children }: TranslatedContentProps) {
  const { t } = useLanguage()
  return <>{children(t)}</>
}

// Helper hook for pages that need translations
export function useTranslation() {
  const { t, language } = useLanguage()
  return { t, language }
}

