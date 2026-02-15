import "./globals.css";

export const metadata = {
  title: "Finex — Income & Expense Management",
  description: "Fintech-style dashboard for small business finance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body bg-surface text-ink">
        {children}
      </body>
    </html>
  );
}
