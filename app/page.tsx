import { AppShell } from "@/components/AppShell";
import { MobileGate } from "@/components/MobileGate";

export default function HomePage() {
  return (
    <MobileGate>
      <AppShell />
    </MobileGate>
  );
}
