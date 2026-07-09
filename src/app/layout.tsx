import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { Providers } from "./providers";
import Sidebar from "./components/Sidebar";
import LoginButton from "./components/LoginButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iron Masters | Dashboard",
  description: "Dashboard de Gerenciamento do Canal YouTube — Iron Masters",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {!session ? (
            <div className="login-screen">
              <div className="login-card">
                <img src="/logo.png" alt="Iron Masters" />
                <h2>Acesso Restrito</h2>
                <p>Faça login com uma conta Google autorizada para acessar o painel de gerenciamento.</p>
                <LoginButton />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", minHeight: "100vh" }}>
              <Sidebar />
              <main className="main-content">
                {children}
              </main>
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
