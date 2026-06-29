import { defineRouting } from 'next-intl/routing'

export const locales = ['en', 'fr', 'es', 'ar', 'zh', 'ru', 'pt', 'de', 'ja', 'hi'] as const
export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
})

export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  ar: 'العربية',
  zh: '中文',
  ru: 'Русский',
  pt: 'Português',
  de: 'Deutsch',
  ja: '日本語',
  hi: 'हिन्दी',
}

export const rtlLocales: Locale[] = ['ar']
