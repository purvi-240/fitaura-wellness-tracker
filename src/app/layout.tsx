import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = { title: "Wellness Tracker", description: "Simple wellness tracker" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <AuthProvider>
          <div className="mx-auto max-w-5xl px-4">
            <Navbar />
            <main className="py-6">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}