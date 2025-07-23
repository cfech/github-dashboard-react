import type { Metadata } from 'next';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'GitHub Dashboard',
  description: 'Real-time GitHub activity dashboard with commit and PR streams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}