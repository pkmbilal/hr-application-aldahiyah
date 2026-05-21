import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  applicationName: "HR Aldahiyah",
  title: "HR Aldahiyah",
  description: "Internal office dashboard for employees, instruments, and vehicles.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HR Aldahiyah",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f9fafb] font-sans">{children}</body>
    </html>
  );
}
