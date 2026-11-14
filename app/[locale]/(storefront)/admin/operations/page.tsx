import { PrototypeNotBuilt } from "@/components/prototype/PrototypeGate";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";

export default function AdminOperationsPage() {
  return (
    <ProtectedPrototypePage allowedScopes={["platform"]} suggestedPersonaId="platform-ops-support">
      <PrototypeNotBuilt />
    </ProtectedPrototypePage>
  );
}
