import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. Configuramos la fuente Inter con la variable CSS
const sans = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gestor de VMs",
  description: "Herramienta interna de gestión",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* 2. Añadimos la variable AL BODY junto con font-sans */}
      <body className={`${sans.variable} font-sans antialiased bg-black text-zinc-300`}>
        {children}
      </body>
    </html>
  );
}