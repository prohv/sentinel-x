import type { Metadata } from 'next';
import { Epilogue, Manrope } from 'next/font/google';
import { Fira_Code } from 'next/font/google';
import { ScanProvider } from '@/hooks/scan-provider';
import './globals.css';

const epilogue = Epilogue({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-epilogue',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-manrope',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sentinel-X',
  description: 'Local-first secret hunter and taint scanner',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${epilogue.variable} ${manrope.variable} ${firaCode.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ScanProvider>{children}</ScanProvider>
      </body>
    </html>
  );
}
