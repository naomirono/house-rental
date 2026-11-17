import './globals.css';

export const metadata = { title: 'Rental Manager', description: 'Rent, water bills and M-Pesa payments' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 antialiased">{children}</body>
    </html>
  );
}
