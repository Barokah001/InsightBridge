import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insight Engine | AI-Resilient Analytics",
  description:
    "Transform data into trustworthy insights with AI-powered analytics that shows confidence, not just answers.",
  keywords: ["analytics", "AI", "data visualization", "insights", "dashboard"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
