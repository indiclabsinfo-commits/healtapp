import type { Metadata } from "next";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindCare — Your Mind Matters",
  description: "Counselling & Wellness Platform by Indic Labs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
