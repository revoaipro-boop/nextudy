import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import Script from "next/script"

export const metadata: Metadata = {
  title: {
    default: "Nextudy - L'Assistant IA Intelligent pour Réviser et Apprendre",
    template: "%s | Nextudy",
  },
  description:
    "Nextudy est la plateforme d'apprentissage révolutionnaire avec IA. Transformez vos cours, PDF et enregistrements en résumés, fiches de révision, QCM et flashcards automatiquement. L'outil parfait pour réviser efficacement avec Nextudy.",
  keywords: [
    "Nextudy",
    "Nextudy plateforme",
    "Nextudy IA",
    "Nextudy révision",
    "révision",
    "étudiant",
    "résumé automatique",
    "flashcards",
    "fiches de révision",
    "QCM",
    "intelligence artificielle",
    "IA éducation",
    "apprentissage",
    "PDF résumé",
    "pomodoro",
    "concentration",
    "chat IA",
    "révision efficace",
    "bachotage",
    "examen",
    "cours",
    "notes de cours",
  ],
  authors: [{ name: "Nextudy" }],
  creator: "Nextudy",
  publisher: "Nextudy",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://nextudy.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    title: "Nextudy - Plateforme IA de Révision et d'Apprentissage Intelligent",
    description:
      "Nextudy : Transformez vos cours en révisions efficaces avec l'IA. Résumés automatiques, flashcards, QCM et plus encore pour réussir vos examens.",
    siteName: "Nextudy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nextudy - Plateforme d'apprentissage avec IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nextudy - Révisez Intelligemment avec l'IA",
    description: "Nextudy transforme vos cours en révisions efficaces avec l'IA",
    images: ["/og-image.png"],
    creator: "@nextudy",
    site: "@nextudy",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  applicationName: "Nextudy",
  verification: {
    google: "votre-code-google-search-console",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nextudy",
    alternateName: "Nextudy - Plateforme d'apprentissage IA",
    description:
      "Nextudy est une plateforme d'apprentissage intelligente avec IA qui génère automatiquement des résumés, fiches de révision, QCM et flashcards à partir de vos documents. L'outil idéal pour réviser efficacement.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://nextudy.vercel.app",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    featureList: [
      "Résumés automatiques de documents avec Nextudy",
      "Génération de flashcards intelligentes",
      "Création de QCM personnalisés",
      "Fiches de révision structurées",
      "Chat IA éducatif avancé",
      "Mode concentration Pomodoro",
      "Support multi-format (PDF, Word, Audio)",
      "Traitement de texte collaboratif",
      "Historique de révisions",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "2500",
    },
    brand: {
      "@type": "Brand",
      name: "Nextudy",
    },
    creator: {
      "@type": "Organization",
      name: "Nextudy",
    },
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MZ2HMD3S');
            `,
          }}
        />
        {/* End Google Tag Manager */}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var root = document.documentElement;
                  
                  if (theme === 'system') {
                    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                  } else {
                    root.classList.add(theme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased bg-white dark:bg-black min-h-screen`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MZ2HMD3S"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <ThemeProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </ThemeProvider>
        <Analytics />
        <Script id="remove-badge" strategy="afterInteractive">
          {`
            window.addEventListener("load", () => {
              const badge = document.querySelector('a[href*="v0.dev"]');
              if (badge) badge.remove();
            });
          `}
        </Script>
      </body>
    </html>
  )
}
