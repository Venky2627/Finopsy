import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Finopsy — Your Money. Autopsied.", description: "Where the hell did your money go?" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
