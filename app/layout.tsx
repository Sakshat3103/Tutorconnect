import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "TutorConnect | Find Trusted Tuition Teachers Near You",
    template: "%s | TutorConnect",
  },
  description:
    "Find verified tuition teachers by subject, class, area and mode, or get AI-based tutor recommendations. Book home, online or at-tutor's-place classes.",
  keywords: [
    "tuition teachers",
    "home tutors near me",
    "online tuition",
    "tuition teacher directory",
    "verified tutors",
  ],
  metadataBase: new URL("https://tutorconnect.example.com"),
  openGraph: {
    title: "TutorConnect | Find Trusted Tuition Teachers Near You",
    description:
      "Find verified tuition teachers and get AI-based tutor recommendations.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Header user={user} />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
