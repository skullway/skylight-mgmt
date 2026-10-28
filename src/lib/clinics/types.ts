export interface ReserveInput {
  startsAt: Date;
  endsAt: Date;
  idempotencyKey: string; // use the appointment id
}

// DEEP_LINK/MANUAL: the therapist finishes the booking on the clinic's site.
// WEB_LOGIN (later): the server books it and returns the clinic's reference.
export type ReserveResult =
  | { kind: "link"; url: string }
  | { kind: "manual" }
  | { kind: "reserved"; reservationRef: string };

export interface ClinicProvider {
  reserveRoom(input: ReserveInput): Promise<ReserveResult>;
}
