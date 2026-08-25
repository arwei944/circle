import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import '../globals.css';

const geistSans = Geist({
   variable: '--font-geist-sans',
   subsets: ['latin'],
});

const geistMono = Geist_Mono({
   variable: '--font-geist-mono',
   subsets: ['latin'],
});

const siteUrl = 'https://circle.lndev.me';

export function generateStaticParams() {
   return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
   params,
}: {
   params: Promise<{ locale: string }>;
}): Promise<Metadata> {
   const { locale } = await params;
   const t = await getTranslations({ locale, namespace: 'common' });

   return {
      title: {
         template: `%s | ${t('siteName')}`,
         default: t('siteName'),
      },
      description: t('siteDescription'),
      openGraph: {
         type: 'website',
         locale: 'zh_CN',
         url: siteUrl,
         siteName: t('siteName'),
         images: [
            {
               url: `${siteUrl}/banner.png`,
               width: 2560,
               height: 1440,
               alt: t('siteName'),
            },
         ],
      },
      twitter: {
         card: 'summary_large_image',
         site: '@ln_dev7',
         creator: '@ln_dev7',
         images: [
            {
               url: `${siteUrl}/banner.png`,
               width: 2560,
               height: 1440,
               alt: t('siteName'),
            },
         ],
      },
      authors: [{ name: 'Leonel NGOYA', url: 'https://lndev.me/' }],
      keywords: ['ui', 'lndev', 'components', 'template'],
   };
}

export default async function LocaleLayout({
   children,
   params,
}: Readonly<{
   children: React.ReactNode;
   params: Promise<{ locale: string }>;
}>) {
   const { locale } = await params;
   if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
      notFound();
   }
   setRequestLocale(locale);

   const messages = await getMessages();

   return (
      <html lang={locale} suppressHydrationWarning>
         <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
         </head>
         <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
            suppressHydrationWarning
         >
            <NuqsAdapter>
               <NextIntlClientProvider messages={messages}>
                  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                     {children}
                     <Toaster />
                  </ThemeProvider>
               </NextIntlClientProvider>
            </NuqsAdapter>
         </body>
      </html>
   );
}
