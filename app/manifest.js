export default function manifest() {
  return {
    name: "HR Aldahiyah",
    short_name: "HR Aldahiyah",
    description: "Internal office dashboard for employees, instruments, and vehicles.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
