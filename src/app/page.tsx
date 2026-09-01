import { redirect } from "next/navigation";

export default function Home() {
  // The birthday experience is a fully static site that lives in /public.
  // Send the root route to its entry page (Page 0 — the countdown lock).
  redirect("/index.html");
}
