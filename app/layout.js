import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "HR Aldahiyah",
  description: "Internal office dashboard for employees, instruments, and vehicles.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f9fafb] font-sans">{children}</body>
    </html>
  );
}
