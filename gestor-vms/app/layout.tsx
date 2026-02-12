import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. Definimos la fuente con la propiedad 'variable'
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", // Esto crea una variable CSS llamada --font-inter
});

export const metadata: Metadata = {
  title: "Waitlist VMs",
  description: "Waitlist VMs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* 2. Añadimos la variable Y las clases font-sans antialiased al body */}
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}