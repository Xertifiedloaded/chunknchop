

import HomeClient from "@/components/home/HomeClient";
import { getHomeContent } from "@/lib/cms/home";

export const revalidate = 60;

export default async function Page() {
  const content = await getHomeContent();
  return <HomeClient content={content} />;
}