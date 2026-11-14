import { PrototypeNotBuilt } from "@/components/prototype/PrototypeGate";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";

export default function AdminOverviewPage() {
  return (
    <ProtectedPrototypePage allowedScopes={["platform"]} suggestedPersonaId="platform-admin">
      <PrototypeNotBuilt />
    </ProtectedPrototypePage>
  );
}
