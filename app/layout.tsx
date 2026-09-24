import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/component/shared/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // A page can set its own title ("Clients"), shown as "Clients | BayShore Company Portal".
  title: {
    default: "BayShore Company Portal",
    template: "%s | BayShore Company Portal",
  },
  description:
    "BayShore Communication's team portal — manage clients, monthly reports, content approvals, meetings and payments in one place.",
  applicationName: "BayShore Company Portal",
  // Staff-only: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
