import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "Northpointe Helpdesk",
    short_name:       "Helpdesk",
    description:      "IT Help Desk Analytics — Northpointe Bank",
    start_url:        "/",
    display:          "standalone",
    background_color: "#ffffff",
    theme_color:      "#D4145A",
    icons: [
      {
        src:     "/icon.svg",
        sizes:   "any",
        type:    "image/svg+xml",
        purpose: "any",
      },
      {
        src:     "/icon.svg",
        sizes:   "any",
        type:    "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
