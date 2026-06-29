import { BuilderRadarApp } from "./builder-radar-app";
import { feeds } from "@/lib/builder-feeds";

export default function Home() {
  return <BuilderRadarApp feeds={feeds} />;
}
