// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Redirect root path directly to the login page
  redirect("/login");
}
