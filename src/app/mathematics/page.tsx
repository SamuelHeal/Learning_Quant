import { redirect } from "next/navigation";
import { BlogCategory } from "@/types";

export const revalidate = 3600; // Revalidate every hour

export default async function MathematicsPage() {
  return redirect(`/${BlogCategory.MATHEMATICS}/subjects`);
}
