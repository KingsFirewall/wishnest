import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WishnestApp } from "@/components/wishnest-app";
export const dynamic="force-dynamic";
export default async function Dashboard(){if (!await getUser()) redirect("/sign-in");return <WishnestApp mode="owner"/>;}
