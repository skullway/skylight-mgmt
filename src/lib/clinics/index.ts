import type { Clinic } from "@/generated/prisma/client";
import type { ClinicProvider } from "./types";
import { buildBookingUrl } from "./deepLink";

export function getProvider(clinic: Clinic): ClinicProvider {
  switch (clinic.integration) {
    case "DEEP_LINK":
      return {
        async reserveRoom({ startsAt, endsAt }) {
          if (!clinic.bookingUrlTemplate) return { kind: "manual" };
          return { kind: "link", url: buildBookingUrl(clinic.bookingUrlTemplate, startsAt, endsAt) };
        },
      };
    case "WEB_LOGIN": // not implemented until the clinic sites are researched
    case "MANUAL":
      return {
        async reserveRoom() {
          return { kind: "manual" };
        },
      };
  }
}
