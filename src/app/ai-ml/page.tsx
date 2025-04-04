import { redirect } from "next/navigation";
import { BlogCategory } from "@/types";

export const revalidate = 3600; // Revalidate every hour

export default async function AiMlPage() {
  return redirect(`/${BlogCategory.AI_ML}/subjects`);
}
