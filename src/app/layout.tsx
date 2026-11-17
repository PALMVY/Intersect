import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trilha das 12 Casas",
  description: "Uma jornada em 12 Casas por filosofia, mente e estratégia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
