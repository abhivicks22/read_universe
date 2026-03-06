import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Anti Gravity — PDF Reader",
  description:
    "The reading experience that defies everything you know. A free, premium browser-based PDF reader with reflow, themes, dictionary, and vocabulary flashcards.",
  keywords: ["PDF reader", "ebook reader", "anti gravity", "reading", "vocabulary"],
};

const googleFontsUrl =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Literata:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Nunito:wght@300;400;600;700&family=Source+Serif+4:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontsUrl} rel="stylesheet" />
      </head>
      <body className={`${outfit.variable} antialiased`} style={{ fontFamily: "var(--font-outfit), 'Outfit', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
