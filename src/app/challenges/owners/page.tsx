import { redirect } from "next/navigation";

/** Preserve the existing ADELVA audience navigation and bookmarked plural URL. */
export default function OwnersRedirect() {
  redirect("/challenges/owner");
}
