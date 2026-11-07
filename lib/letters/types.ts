/** Available Letter Types with human-friendly descriptions */
export const AVAILABLE_LETTER_TYPES = [
  { type: "SALARY_CERTIFICATE", label: "Salary Certificate", description: "Official certificate detailing monthly salary breakdown for banks or authorities." },
  { type: "EMPLOYMENT", label: "Employment Certificate", description: "Proof of current active employment, designation, and tenure." },
  { type: "EXPERIENCE", label: "Experience Letter", description: "Detailed experience and service verification letter." },
  { type: "NOC", label: "NOC (No Objection Certificate)", description: "No objection certificate for travel, driving license, or study." },
  { type: "BANK_ACCOUNT", label: "Bank Account Opening Letter", description: "Addressed to UAE banking institutions to open payroll/salary accounts." },
  { type: "VISA_SUPPORT", label: "Visa Support Letter", description: "Official consulate/embassy support letter for travel visas." },
  { type: "EMBASSY", label: "Embassy Attestation Letter", description: "Verification letter for foreign mission and consulate affairs." },
  { type: "ADDRESS_CONFIRMATION", label: "Address Confirmation Letter", description: "Proof of company location and registered residence." },
  { type: "EMPLOYMENT_VERIFICATION", label: "Employment Verification Letter", description: "Third-party background check and employment verification." },
  { type: "CUSTOM_HR", label: "Custom HR Letter", description: "General tailored corporate letter for custom official purposes." },
] as const;

export type AvailableLetterType = (typeof AVAILABLE_LETTER_TYPES)[number]["type"];

