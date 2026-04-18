import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Secret Suite | Secure Cryptographic Toolkit',
  description: 'Full cryptographic toolkit for generating secrets, hashing passwords, encrypting data, and managing keypairs.',
  robots: 'noindex, nofollow',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--ss-bg-elevated)',
              color: 'var(--ss-text-primary)',
              border: '1px solid var(--ss-border)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: 'var(--ss-green)', secondary: 'var(--ss-bg-elevated)' },
            },
            error: {
              iconTheme: { primary: 'var(--ss-red)', secondary: 'var(--ss-bg-elevated)' },
            },
          }}
        />
      </body>
    </html>
  );
}
