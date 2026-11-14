import { PrototypeNotBuilt } from "@/components/prototype/PrototypeGate";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";

export default function AdminFinancePage() {
  return (
    <ProtectedPrototypePage allowedScopes={["platform"]} suggestedPersonaId="platform-finance">
      <PrototypeNotBuilt />
    </ProtectedPrototypePage>
  );
}
