"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Mail,
  UserPlus,
  CreditCard,
  Layers,
  Building2,
  Briefcase,
  Clock,
  Check,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WizardPlan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  priceMonthly: number;
  priceAnnual: number;
  maxEmployees: number;
  maxCompanies: number;
  maxLocations: number;
  hasPayroll: boolean;
  hasCompliance: boolean;
  hasRecruitment: boolean;
  hasCustomTheme: boolean;
  hasApiAccess: boolean;
}

interface WizardModule {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category: string;
  isCore: boolean;
}

interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  formData: {
    name: string;
    slug: string;
    currency: string;
    tradeLicenseNumber: string;
    taxId: string;
    adminName: string;
    adminEmail: string;
    planTier: string;
    selectedModules: string[];
  };
}

const STEPS = [
  { id: 1, label: "Company Details", icon: Building2 },
  { id: 2, label: "Administrator", icon: UserPlus },
  { id: 3, label: "Subscription Plan", icon: CreditCard },
  { id: 4, label: "Module Configuration", icon: Layers },
  { id: 5, label: "Review & Confirm", icon: Check },
] as const;

const initialState: WizardState = {
  step: 1,
  formData: {
    name: "",
    slug: "",
    currency: "AED",
    tradeLicenseNumber: "",
    taxId: "",
    adminName: "",
    adminEmail: "",
    planTier: "STARTER",
    selectedModules: [],
  },
};

export function CompanyOnboardingWizard({ plans, modules }: { plans: WizardPlan[]; modules: WizardModule[] }) {
  const [wizard, setWizard] = useState<WizardState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canGoNext = useCallback(() => {
    const { step, formData } = wizard;
    switch (step) {
      case 1:
        return Boolean(formData.name.trim() && formData.slug.trim());
      case 2:
        return Boolean(formData.adminName.trim() && formData.adminEmail.trim());
      case 3:
        return Boolean(formData.planTier);
      case 4:
        return true;
      default:
        return false;
    }
  }, [wizard]);

  const goNext = () => {
    if (wizard.step < 5 && canGoNext()) {
      setWizard((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const goPrev = () => {
    if (wizard.step > 1) {
      setWizard((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const updateField = (field: keyof WizardState["formData"], value: string | string[]) => {
    setWizard((prev) => ({ ...prev, formData: { ...prev.formData, [field]: value } }));
  };

  const toggleModule = (moduleId: string) => {
    setWizard((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        selectedModules: prev.formData.selectedModules.includes(moduleId)
          ? prev.formData.selectedModules.filter((m) => m !== moduleId)
          : [...prev.formData.selectedModules, moduleId],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/super-admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: wizard.formData.name,
          slug: wizard.formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          adminName: wizard.formData.adminName,
          adminEmail: wizard.formData.adminEmail,
          planTier: wizard.formData.planTier,
          tradeLicenseNumber: wizard.formData.tradeLicenseNumber,
          taxId: wizard.formData.taxId,
          currency: wizard.formData.currency,
          moduleIds: wizard.formData.selectedModules,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create company");
      }

      const result = await response.json();
      toast.success(`Company "${wizard.formData.name}" created successfully`);
      setTimeout(() => {
        window.location.href = `/super-admin/companies/${result.tenantId}`;
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to create company");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = STEPS.find((s) => s.id === wizard.step)!;
  const selectedPlan = plans.find((p) => p.id === wizard.formData.planTier);

  const stepProgress = (wizard.step - 1) / (STEPS.length - 1);

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Wizard Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Company</h1>
            <p className="text-sm text-slate-400">Multi-tenant organization onboarding</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Step {wizard.step} of {STEPS.length}</span>
            <span className="text-xs font-medium text-slate-400">Progress</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-800/50">
            <div className="relative h-full w-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ transform: `scaleX(${stepProgress})`, transformOrigin: "left" }} />
          </div>
        </div>
      </motion.div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {STEPS.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: step.id * 0.05 }}
            className={cn(
              "flex flex-col items-center gap-2 px-3 py-4 rounded-2xl transition-all duration-300",
              wizard.step === step.id
                ? "bg-indigo-500/10 border border-indigo-500/30 shadow-lg shadow-indigo-500/20"
                : wizard.step > step.id
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-slate-900/50 border border-slate-800/50"
            )}
          >
            <div className="flex items-center justify-center rounded-full p-1.5">
              {wizard.step > step.id ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : wizard.step === step.id ? (
                <step.icon className="h-5 w-5 text-indigo-500" />
              ) : (
                <step.icon className="h-5 w-5 text-slate-500" />
              )}
            </div>
            <p className={cn("text-xs font-medium", wizard.step <= step.id ? "text-white" : "text-slate-400")}>
              {step.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Wizard Form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-3xl p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Company Details */}
          <AnimatePresence mode="wait">
            {wizard.step === 1 && (
              <motion.div key="step-1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-indigo-400 shrink-0" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Company Information</h2>
                    <p className="text-sm text-slate-400">Basic details about the organization</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Acme Corporation"
                            value={wizard.formData.name}
                            onChange={(e) => updateField("name", e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>Legal trading name of the company</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="companySlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomain</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="acme-corp"
                            value={wizard.formData.slug}
                            onChange={(e) => updateField("slug", e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>.hrms-saas.com</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Select onValueChange={(value) => updateField("currency", value)} defaultValue={wizard.formData.currency}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="tradeLicense"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trade License Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CN-1234567"
                            value={wizard.formData.tradeLicenseNumber}
                            onChange={(e) => updateField("tradeLicenseNumber", e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>Business registration or trade license number</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax / VAT ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="100123456700003"
                          value={wizard.formData.taxId}
                          onChange={(e) => updateField("taxId", e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>Tax identification number</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 2: Administrator */}
          <AnimatePresence mode="wait">
            {wizard.step === 2 && (
              <motion.div key="step-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-start gap-3">
                  <UserPlus className="h-5 w-5 text-indigo-400 shrink-0" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Company Administrator</h2>
                    <p className="text-sm text-slate-400">Create the initial administrator account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            value={wizard.formData.adminName}
                            onChange={(e) => updateField("adminName", e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>Full name of the company administrator</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@acme.com"
                            value={wizard.formData.adminEmail}
                            onChange={(e) => updateField("adminEmail", e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>Email address for the administrator account</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-300 font-medium">Administrator will receive:</p>
                      <ul className="text-sm text-slate-400 mt-1 space-y-1 list-disc list-inside">
                        <li>Welcome email with login credentials</li>
                        <li>Access to company admin portal</li>
                        <li>Ability to invite additional users</li>
                        <li>Company settings management</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Subscription Plan */}
          <AnimatePresence mode="wait">
            {wizard.step === 3 && (
              <motion.div key="step-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-indigo-400 shrink-0" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Subscription Plan</h2>
                    <p className="text-sm text-slate-400">Choose the pricing tier for this company</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => {
                    const isSelected = wizard.formData.planTier === plan.id;
                    return (
                      <motion.div
                        key={plan.id}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex flex-col items-center justify-between rounded-2xl p-6 border transition-all duration-200",
                          isSelected
                            ? "bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500"
                            : "bg-slate-900/50 border-slate-700/50 hover:border-indigo-500/30"
                        )}
                        onClick={() => updateField("planTier", plan.id)}
                      >
                        <div className="text-center">
                          <h3 className={cn("font-semibold text-white", isSelected ? "text-indigo-400" : "text-slate-300")}>
                            {plan.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">{plan.description || ""}</p>
                        </div>

                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white">${plan.priceMonthly.toFixed(0)}</span>
                          <span className="text-xs text-slate-500">/month</span>
                        </div>

                        <div className="mt-6 space-y-2">
                          <FeatureRow feature="Payroll Management" enabled={plan.hasPayroll} />
                          <FeatureRow feature="Compliance & Audit" enabled={plan.hasCompliance} />
                          <FeatureRow feature="Recruitment Tools" enabled={plan.hasRecruitment} />
                          <FeatureRow feature="Custom Theme" enabled={plan.hasCustomTheme} />
                          <FeatureRow feature="API Access" enabled={plan.hasApiAccess} />
                        </div>

                        <div className="mt-auto">
                          <span className="text-sm font-medium text-slate-400">
                            Up to {plan.maxEmployees} employees
                          </span>
                          <span className="text-xs text-slate-500 block mt-1">
                            {plan.maxCompanies} company{"es" !== "" ? "ies" : ""} • {plan.maxLocations} locations
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="text-center mt-4">
                  <span className="text-xs text-slate-500">
                    Plans can be changed later from the Subscriptions page
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 4: Module Configuration */}
          <AnimatePresence mode="wait">
            {wizard.step === 4 && (
              <motion.div key="step-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-start gap-3">
                  <Layers className="h-5 w-5 text-indigo-400 shrink-0" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Module Configuration</h2>
                    <p className="text-sm text-slate-400">Enable specific SaaS modules for this company</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.map((module) => {
                    const isEnabled = wizard.formData.selectedModules.includes(module.id);
                    return (
                      <motion.div
                        key={module.id}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-center justify-between rounded-xl p-4 border transition-all duration-200 group",
                          isEnabled
                            ? "bg-indigo-500/10 border-indigo-500/30"
                            : "bg-slate-900/50 border-slate-700/50 hover:border-indigo-500/30"
                        )}
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isEnabled} onCheckedChange={() => toggleModule(module.id)} />
                          <div>
                            <p className={cn("font-medium text-white", module.isCore && "text-indigo-400")}>
                              {module.name}
                            </p>
                            <p className="text-xs text-slate-500">{module.category}</p>
                            {module.isCore && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                Core Module
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <Briefcase className="h-3 w-3" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="text-center">
                  <span className="text-sm text-slate-400">
                    Core modules are always enabled. Select additional modules based on subscription plan.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 5: Review & Confirm */}
          <AnimatePresence mode="wait">
            {wizard.step === 5 && (
              <motion.div key="step-5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Review & Confirm</h2>
                    <p className="text-sm text-slate-400">Review company details before creation</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ReviewRow label="Company Name" value={wizard.formData.name} icon={Building2} />
                  <ReviewRow label="Subdomain" value={`${wizard.formData.slug}.hrms-saas.com`} icon={Mail} />
                  <ReviewRow label="Administrator" value={wizard.formData.adminName} icon={UserPlus} />
                  <ReviewRow label="Admin Email" value={wizard.formData.adminEmail} icon={Mail} />
                  <ReviewRow label="Plan" value={selectedPlan?.name || "Starter"} icon={CreditCard} />
                  <ReviewRow label="Currency" value={wizard.formData.currency} icon={Briefcase} />
                  <ReviewRow
                    label="Modules"
                    value={wizard.formData.selectedModules.length > 0 ? wizard.formData.selectedModules.join(", ") : "None (core modules only)"}
                    icon={Layers}
                  />
                  {wizard.formData.tradeLicenseNumber && (
                    <ReviewRow label="Trade License" value={wizard.formData.tradeLicenseNumber} />
                  )}
                  {wizard.formData.taxId && (
                    <ReviewRow label="Tax / VAT ID" value={wizard.formData.taxId} />
                  )}
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-white mb-2">What happens next?</h3>
                  <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                    <li>Company tenant will be provisioned</li>
                    <li>Administrator account will be created</li>
                    <li>Welcome email with login credentials sent</li>
                    <li>Company will appear in the Companies list</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-800/50">
            {wizard.step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={goPrev}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
            <div className="flex items-center gap-2">
              {wizard.step < 5 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={goNext}
                  disabled={!canGoNext() || isSubmitting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Company <ExternalLink className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Helper Components

function FeatureRow({ feature, enabled }: { feature: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{feature}</span>
      <span className={cn("text-xs font-bold", enabled ? "text-emerald-400" : "text-slate-600")}>
        {enabled ? "Included" : "Not included"}
      </span>
    </div>
  );
}

function ReviewRow({ label, value, icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/30 last:border-0">
      <div className="flex items-center gap-3">
        {icon && <icon className="h-4 w-4 text-slate-500" />}
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-medium text-white max-w-xs truncate">{value}</span>
    </div>
  );
}