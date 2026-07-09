import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://georgebuilderradar.snackoverflowgeorge.com"),
  title: "George's Builder Radar",
  description:
    "A public builder-signal radar tracking AI systems, agent workflows, repos, launches, and devtool updates.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    title: "George's Builder Radar",
    description:
      "A public builder-signal radar tracking AI systems, agent workflows, repos, launches, and devtool updates.",
    url: "https://georgebuilderradar.snackoverflowgeorge.com",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
