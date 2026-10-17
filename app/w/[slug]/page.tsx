import { WishnestApp } from "@/components/wishnest-app";
export default async function List({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <WishnestApp mode="guest" slug={slug}/>;}
