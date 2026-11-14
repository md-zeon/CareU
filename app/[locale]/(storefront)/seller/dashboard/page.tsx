import { PrototypeNotBuilt } from "@/components/prototype/PrototypeGate";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";

export default function SellerDashboardPage() {
  return (
    <ProtectedPrototypePage allowedScopes={["seller"]} suggestedPersonaId="seller-owner">
      <PrototypeNotBuilt />
    </ProtectedPrototypePage>
  );
}
