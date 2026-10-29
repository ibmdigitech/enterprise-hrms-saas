"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

const INTEGRATIONS_CATALOG = [
  {
    key: "stripe",
    name: "Stripe Billing & Subscriptions",
    category: "Payment Gateway",
    description: "Credit card processing, recurring subscription charges, and customer payment portal.",
    status: "CONNECTED",
  },
  {
    key: "uae_wps",
    name: "UAE Wages Protection System (WPS)",
    category: "Government Compliance",
    description: "SIF generation conforming to UAE Central Bank and Ministry of Human Resources standards.",
    status: "ACTIVE",
  },
  {
    key: "biometric_terminal",
    name: "ZKTeco & Biometric Terminals",
    category: "Hardware Integration",
    description: "SHA-256 encrypted push endpoints for punch-clock devices across physical offices.",
    status: "ACTIVE",
  },
  {
    key: "sendgrid",
    name: "SendGrid Email Relay",
    category: "Communications",
    description: "Transactional notifications for document renewals, payslip dispatches, and credential setup.",
    status: "CONFIGURED",
  },
  {
    key: "microsoft_entra",
    name: "Microsoft Entra ID / Office 365",
    category: "Single Sign-On (SSO)",
    description: "Enterprise OAuth and SAML federation for corporate tenant employee single sign-on.",
    status: "CONFIGURED",
  },
  {
    key: "aws_s3",
    name: "Amazon Web Services (S3)",
    category: "Cloud Document Storage",
    description: "Encrypted object storage for employee passport scans, visas, and contracts.",
    status: "CONFIGURED",
  },
];

export async function getIntegrationsAction() {
  await requireSuperAdmin("platform.integrations.view");

  return INTEGRATIONS_CATALOG;
}

