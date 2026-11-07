import { redirect } from "next/navigation";

// Canonical letter management has been consolidated into /letters with full
// template governance, approvals workflow, and official branding.
export default function Page() {
    redirect("/letters");
}
