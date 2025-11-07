'use client';

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/context/SidebarContext";
import React, { useCallback } from 'react';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import Providers from "@/components/Providers";
import { usePathname } from 'next/navigation';

function LayoutWithSidebar({ children }) {
  const { isOpen } = useSidebar();

  return (
    <div className="flex relative z-10">
      <Sidebar />
      <main
        className={`flex-grow transition-all duration-300`}
        style={{
          marginLeft: isOpen ? '16rem' : '5rem', // Tailwind w-64(256px), w-20(80px)과 동일
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  const particlesInit = useCallback(async engine => {
    console.log(engine);
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async container => {
    await console.log(container);
  }, []);

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="bg-transparent">
        <Providers>
          <SidebarProvider>
              <Particles
                id="tsparticles"
                init={particlesInit}
                loaded={particlesLoaded}
                options={{
                  background: {
                    color: {
                      value: "#f9fafb",
                    },
                  },
                  fpsLimit: 120,
                  interactivity: {
                    events: {
                      onClick: {
                        enable: true,
                        mode: "push",
                      },
                      onHover: {
                        enable: true,
                        mode: "repulse",
                      },
                      resize: true,
                    },
                    modes: {
                      push: {
                        quantity: 4,
                      },
                      repulse: {
                        distance: 200,
                        duration: 0.4,
                      },
                    },
                  },
                  particles: {
                    color: {
                      value: "#a0aec0",
                    },
                    links: {
                      color: "#a0aec0",
                      distance: 150,
                      enable: true,
                      opacity: 0.5,
                      width: 1,
                    },
                    move: {
                      direction: "none",
                      enable: true,
                      outModes: {
                        default: "bounce",
                      },
                      random: false,
                      speed: 2,
                      straight: false,
                    },
                    number: {
                      density: {
                        enable: true,
                        area: 800,
                      },
                      value: 80,
                    },
                    opacity: {
                      value: 0.5,
                    },
                    shape: {
                      type: "circle",
                    },
                    size: {
                      value: { min: 1, max: 5 },
                    },
                  },
                  detectRetina: true,
                }}
              />
            {isAuthPage ? (
              <div className="relative z-10">
                {children}
              </div>
            ) : (
              <div className="flex relative z-10">
                <Sidebar />
                <main className="flex-grow w-full">{children}</main>
              </div>
            )}
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
