import { Mapa } from "@/components/mapa";

export default function MapPage() {
  return (
    <>
      <header className="bg-primary flex items-center justify-center absolute top-0 w-full">
        <img src="/logo.svg" alt="logo" className="h-12" />
      </header>

      <div className="mt-32 max-w-5xl mx-auto p-4 max-h-32">
        <Mapa />
      </div>
    </>
  )
}