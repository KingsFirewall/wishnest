import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { WishnestApp } from "@/components/wishnest-app";
export const dynamic="force-dynamic";
export default async function Dashboard(){await requireChatGPTUser("/dashboard");return <WishnestApp mode="owner"/>;}
