import type { Metadata } from "next";
import { ClientProvider } from "../src/providers/Client-Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assistance Agent Admin",
  description: "管理后台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
