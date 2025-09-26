'use client';

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/context/SidebarContext";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <SidebarProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-grow w-full">{children}</main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
