import type { Metadata } from "next";
import { HomeClient } from "@/components/home/HomeClient";

export const metadata: Metadata = {
  title: "Licitaciones y Convocatorias con IA | Bidtory Colombia",
  description:
    "Encuentre licitaciones y convocatorias relevantes en Colombia. Bidtory filtra las mejores oportunidades para su empresa y lo alerta. ¡Ahorre tiempo y aplique más!",
};

export default function Home() {
  return <HomeClient />;
}
