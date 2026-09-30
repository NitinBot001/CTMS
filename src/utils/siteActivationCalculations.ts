/**
 * Site Activation Readiness Calculation Engine
 * 
 * Evaluates study-level and site-level document packages to determine readiness
 * for clinical site activation in accordance with CDSCO, GCP-ASU, and CTRI benchmarks.
 * 
 * DISCLAIMER:
 * SYNTHETIC MOCK TEST VALIDATION ENGINE — NOT A LEGAL REGULATORY DETERMINATION.
 */

import { Document, SiteActivationReadinessResult } from '../types';

export interface SiteActivationOptions {
  requireColdChain?: boolean;
  evaluationDate?: string; // YYYY-MM-DD (defaults to '2026-09-29')
  requireApprovedSIV?: boolean;
  bundleId?: string;
}

export interface RequiredDocumentCheck {
  code: string;
  name: string;
  category: 'REGULATORY_ETHICS' | 'PROTOCOL_SCIENTIFIC' | 'SITE_INVESTIGATOR' | 'CONTRACTUAL_FINANCIAL' | 'IP_PHARMACY' | 'LABORATORY' | 'ACTIVATION_READINESS';
  matcher: (doc: Document) => boolean;
  isCritical: boolean;
  requiredForActivation: boolean;
}

export const CORE_STARTUP_REQUIREMENT_CHECKS: RequiredDocumentCheck[] = [
  // Category A: Regulatory & Ethics
  {
    code: 'CDSCO_PERMISSION',
    name: 'CDSCO Form CT-06 Clinical Trial Permission',
    category: 'REGULATORY_ETHICS',
    matcher: (d) => d.category === 'REGULATORY' && /CDSCO|CT-06|Permission/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'IEC_APPROVAL',
    name: 'Institutional Ethics Committee (IEC) Final Approval',
    category: 'REGULATORY_ETHICS',
    matcher: (d) => d.category === 'ETHICS' && /Ethics Committee|IEC.*Approval/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'IEC_APPROVED_ICF',
    name: 'IEC Approved Informed Consent Document (ICD/PIS)',
    category: 'REGULATORY_ETHICS',
    matcher: (d) => (d.category === 'ETHICS' || d.category === 'INFORMED_CONSENT') && /Informed Consent|ICD|PIS/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'CTRI_REGISTRATION',
    name: 'CTRI Registration Confirmation Acknowledgment',
    category: 'REGULATORY_ETHICS',
    matcher: (d) => d.category === 'REGULATORY' && /CTRI/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },

  // Category B: Protocol & Scientific
  {
    code: 'STUDY_PROTOCOL',
    name: 'Approved Active Study Protocol',
    category: 'PROTOCOL_SCIENTIFIC',
    matcher: (d) => d.category === 'PROTOCOL' && /Protocol/i.test(d.title) && d.status !== 'SUPERSEDED' && d.status !== 'ARCHIVED',
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'INVESTIGATOR_BROCHURE',
    name: "Investigator's Brochure (IB)",
    category: 'PROTOCOL_SCIENTIFIC',
    matcher: (d) => d.category === 'PROTOCOL' && /Brochure|IB/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'PATIENT_ICF_LOCAL',
    name: 'Site Patient Information Sheet & ICF (English/Local Language)',
    category: 'PROTOCOL_SCIENTIFIC',
    matcher: (d) => d.category === 'INFORMED_CONSENT',
    isCritical: true,
    requiredForActivation: true,
  },

  // Category C: Site & Investigator Qualification
  {
    code: 'FORM_CT02_UNDERTAKING',
    name: 'Form CT-02 Investigator Undertaking',
    category: 'SITE_INVESTIGATOR',
    matcher: (d) => d.category === 'SITE' && /CT-02|Undertaking/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'PI_CV_CREDENTIALS',
    name: 'Principal Investigator Signed CV & Registration',
    category: 'SITE_INVESTIGATOR',
    matcher: (d) => d.category === 'SITE' && /CV.*PI|Curriculum Vitae.*PI|Rajesh Sharma/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'PI_GCP_CERTIFICATE',
    name: 'Principal Investigator GCP Training Certificate',
    category: 'SITE_INVESTIGATOR',
    matcher: (d) => d.category === 'TRAINING' && /GCP.*PI|GCP.*Rajesh Sharma/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'STAFF_GCP_CERTIFICATES',
    name: 'Site Key Staff (Sub-I / CRC / Pharmacist) GCP Training',
    category: 'SITE_INVESTIGATOR',
    matcher: (d) => d.category === 'TRAINING' && /GCP.*(Sub-I|CRC|Pharmacist|Patil|Nair|Seth)/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'SITE_FEASIBILITY',
    name: 'Site Feasibility & Adequacy Report',
    category: 'SITE_INVESTIGATOR',
    matcher: (d) => d.category === 'SITE' && /Feasibility|Adequacy/i.test(d.title),
    isCritical: false,
    requiredForActivation: true,
  },

  // Category D: Contractual & Financial
  {
    code: 'CLINICAL_TRIAL_AGREEMENT',
    name: 'Clinical Trial Agreement (CTA) Executed Tripartite',
    category: 'CONTRACTUAL_FINANCIAL',
    matcher: (d) => /CTA|Clinical Trial Agreement/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'CLINICAL_TRIAL_INSURANCE',
    name: 'Clinical Trial Subject Compensation Insurance Policy',
    category: 'CONTRACTUAL_FINANCIAL',
    matcher: (d) => /Insurance|Compensation Policy/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'FINANCIAL_DISCLOSURES',
    name: 'Investigator Financial Conflict of Interest Disclosures',
    category: 'CONTRACTUAL_FINANCIAL',
    matcher: (d) => /Financial Disclosure/i.test(d.title),
    isCritical: false,
    requiredForActivation: true,
  },

  // Category E: IP & Pharmacy
  {
    code: 'COA_INVESTIGATIONAL_PRODUCT',
    name: 'Certificate of Analysis (CoA) — Investigational Product',
    category: 'IP_PHARMACY',
    matcher: (d) => d.category === 'PHARMACY' && /CoA.*(Extract|Ashwagandha|Investigational)/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'COA_PLACEBO',
    name: 'Certificate of Analysis (CoA) — Matching Placebo',
    category: 'IP_PHARMACY',
    matcher: (d) => d.category === 'PHARMACY' && /CoA.*Placebo/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'GMP_CERTIFICATE',
    name: 'Investigational Product GMP Manufacturing Certification (Schedule T / M)',
    category: 'IP_PHARMACY',
    matcher: (d) => d.category === 'PHARMACY' && /GMP|Manufacturing/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'PHARMACY_TEMPERATURE_CALIBRATION',
    name: 'Pharmacy Storage Temperature Logger Calibration Certificate',
    category: 'IP_PHARMACY',
    matcher: (d) => d.category === 'PHARMACY' && /Calibration|Temperature/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'PHARMACY_DISPENSING_SOP',
    name: 'Investigational Product Dispensing & Accountability SOP',
    category: 'IP_PHARMACY',
    matcher: (d) => d.category === 'PHARMACY' && /Dispensing|Accountability|SOP/i.test(d.title),
    isCritical: false,
    requiredForActivation: true,
  },

  // Category F: Laboratory & Diagnostic
  {
    code: 'LAB_ACCREDITATION',
    name: 'Central / Site Clinical Laboratory NABL Accreditation Certificate',
    category: 'LABORATORY',
    matcher: (d) => d.category === 'LABORATORY' && /NABL|Accreditation|ISO 15189/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
  {
    code: 'LAB_REFERENCE_RANGES',
    name: 'Laboratory Biological Reference Normal Ranges & Manual',
    category: 'LABORATORY',
    matcher: (d) => d.category === 'LABORATORY' && /Reference.*Ranges|Normal Ranges/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },

  // Category G: Site Initiation & Activation Readiness
  {
    code: 'SIV_DOA_REPORT',
    name: 'Site Initiation Visit (SIV) Report & Delegation of Authority (DOA) Log',
    category: 'ACTIVATION_READINESS',
    matcher: (d) => (d.category === 'SITE' || d.category === 'OTHER') && /SIV|Site Initiation|Delegation of Authority|DOA/i.test(d.title),
    isCritical: true,
    requiredForActivation: true,
  },
];

const CATEGORY_NAMES: Record<string, string> = {
  REGULATORY_ETHICS: 'A. Regulatory & Ethics Clearances',
  PROTOCOL_SCIENTIFIC: 'B. Study Protocol & Core Scientific Package',
  SITE_INVESTIGATOR: 'C. Site & Investigator Qualification',
  CONTRACTUAL_FINANCIAL: 'D. Contractual & Financial Governance',
  IP_PHARMACY: 'E. Investigational Product & Pharmacy Start-up',
  LABORATORY: 'F. Laboratory & Diagnostic Accreditation',
  ACTIVATION_READINESS: 'G. Site Initiation & Activation Readiness',
};

/**
 * Calculates deterministic site activation readiness from document repository
 */
export function calculateSiteActivationReadiness(
  studyId: string,
  siteId: string,
  documents: Document[],
  activeProtocolVersion = '1.1',
  options: SiteActivationOptions = {}
): SiteActivationReadinessResult {
  const evalDate = options.evaluationDate || '2026-09-29';
  const evalTimestamp = new Date(`${evalDate}T00:00:00Z`).getTime();
  const thirtyDaysLater = new Date(evalTimestamp + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Scope documents to study + site (or study-wide all sites)
  let scopedDocs = documents.filter(
    (d) =>
      d.studyId === studyId &&
      (d.siteId === siteId || d.applicability === 'ALL_SITES' || !d.siteId)
  );

  // If bundleId option is specified, filter to that bundle
  if (options.bundleId) {
    scopedDocs = scopedDocs.filter((d) => d.bundleId === options.bundleId);
  } else {
    // If start-up bundle documents exist in scope, evaluate the start-up bundle
    const bundleDocs = scopedDocs.filter((d) => Boolean(d.bundleId));
    if (bundleDocs.length > 0) {
      scopedDocs = bundleDocs;
    }
  }

  const blockingIssues: string[] = [];
  const conditions: string[] = [];
  const warnings: string[] = [];
  const missingRequiredTypes: string[] = [];

  let approvedCount = 0;
  let pendingReviewCount = 0;
  let expiredCount = 0;
  let expiringSoonCount = 0;

  // Category breakdown tracker
  const categoryStats: Record<
    string,
    { categoryName: string; total: number; approved: number; missing: number; expired: number; isReady: boolean }
  > = {};

  for (const catKey of Object.keys(CATEGORY_NAMES)) {
    categoryStats[catKey] = {
      categoryName: CATEGORY_NAMES[catKey],
      total: 0,
      approved: 0,
      missing: 0,
      expired: 0,
      isReady: true,
    };
  }

  // 1. Evaluate Core Requirement Checks
  for (const check of CORE_STARTUP_REQUIREMENT_CHECKS) {
    categoryStats[check.category].total++;
    const matchingDocs = scopedDocs.filter((d) => check.matcher(d));

    if (matchingDocs.length === 0) {
      // Document is completely missing
      categoryStats[check.category].missing++;
      missingRequiredTypes.push(check.name);
      if (check.isCritical) {
        blockingIssues.push(`Missing critical start-up requirement: ${check.name}.`);
        categoryStats[check.category].isReady = false;
      } else {
        conditions.push(`Recommended document missing: ${check.name}.`);
      }
      continue;
    }

    // Examine matching documents for status, expiry, and approvals
    let hasApprovedAndValid = false;
    let hasExpiringSoon = false;
    let hasPendingReview = false;
    let hasExpired = false;
    let rejectedDoc: Document | null = null;

    for (const doc of matchingDocs) {
      // Check rejection
      if (doc.reviewStatus === 'REJECTED') {
        rejectedDoc = doc;
        continue;
      }

      // Check expiry against evaluation date
      const isDocExpired = Boolean(doc.expiryDate && doc.expiryDate < evalDate);
      const isDocExpiringSoon = Boolean(
        doc.expiryDate &&
        doc.expiryDate >= evalDate &&
        doc.expiryDate <= thirtyDaysLater
      );

      if (isDocExpired || doc.status === 'EXPIRED') {
        hasExpired = true;
      } else if (isDocExpiringSoon || doc.status === 'EXPIRING_SOON') {
        hasExpiringSoon = true;
      }

      if (doc.reviewStatus === 'PENDING_REVIEW' || doc.status === 'DRAFT') {
        hasPendingReview = true;
      }

      // Considered valid if active (or expiring soon but not expired)
      if (
        (doc.status === 'ACTIVE' || doc.status === 'EXPIRING_SOON') &&
        !isDocExpired
      ) {
        if (doc.reviewStatus === 'REVIEWED_ACCEPTED' || !doc.reviewStatus) {
          hasApprovedAndValid = true;
        }
      }
    }

    if (rejectedDoc) {
      blockingIssues.push(
        `Rejected start-up document: ${rejectedDoc.title} (${rejectedDoc.rejectionReason || 'Rejected during review'}).`
      );
      categoryStats[check.category].isReady = false;
    } else if (hasExpired && !hasApprovedAndValid) {
      expiredCount++;
      categoryStats[check.category].expired++;
      blockingIssues.push(`Expired required document: ${check.name} has expired on or before ${evalDate}.`);
      categoryStats[check.category].isReady = false;
    } else if (hasPendingReview && !hasApprovedAndValid) {
      pendingReviewCount++;
      // Pending review
      if (options.requireApprovedSIV && check.code === 'SIV_DOA_REPORT') {
        blockingIssues.push(`${check.name} is currently pending formal CRO review/sign-off.`);
        categoryStats[check.category].isReady = false;
      } else {
        conditions.push(`${check.name} has draft or pending review status awaiting final sign-off.`);
      }
    } else if (hasApprovedAndValid) {
      approvedCount++;
      categoryStats[check.category].approved++;
    }

    if (hasExpiringSoon) {
      expiringSoonCount++;
      warnings.push(`${check.name} expires within 30 days of ${evalDate}; renewal task should be initiated.`);
      conditions.push(`${check.name} renewal required within 30 days.`);
    }
  }

  // 2. Protocol Version Consistency Check
  const siteProtocols = scopedDocs.filter(
    (d) => d.category === 'PROTOCOL' && /Protocol/i.test(d.title)
  );
  const activeProtocols = siteProtocols.filter((d) => d.status === 'ACTIVE');
  const highestVersion = siteProtocols.map((p) => p.currentVersionNumber).sort().reverse()[0];
  const hasActiveHighest = activeProtocols.some((p) => (p.currentVersionNumber || '') >= activeProtocolVersion);

  if (!hasActiveHighest || !highestVersion || highestVersion < activeProtocolVersion) {
    const issueMsg = highestVersion
      ? `Protocol version mismatch: Site has version ${highestVersion}, but active protocol version is ${activeProtocolVersion}.`
      : `Protocol version mismatch: Missing active study protocol matching active version ${activeProtocolVersion}.`;
    blockingIssues.push(issueMsg);
    categoryStats.PROTOCOL_SCIENTIFIC.isReady = false;
  }

  // 3. Conditional Requirements Check (e.g., Specialized Bio-specimen cold chain courier)
  if (options.requireColdChain) {
    const coldChainDoc = scopedDocs.find(
      (d) => /Cold.*Chain|Dry.*Ice|Courier/i.test(d.title) && d.status === 'ACTIVE'
    );
    if (!coldChainDoc) {
      blockingIssues.push(
        'Conditional requirement missing: Specialized Bio-Specimen Cold Chain Courier Agreement is mandatory for frozen dry-ice sample transport.'
      );
      categoryStats.LABORATORY.isReady = false;
    } else {
      conditions.push('Conditional verification: Frozen bio-specimen dry-ice transport SLA verified.');
    }
  }

  // 4. Overall Status Determination
  let status: 'READY' | 'READY_WITH_CONDITIONS' | 'NOT_READY';
  let statusLabel: string;
  let isReadyForActivation: boolean;

  if (scopedDocs.length === 0 || blockingIssues.length > 0) {
    status = 'NOT_READY';
    statusLabel = 'Document Readiness: Not Ready';
    isReadyForActivation = false;
  } else if (conditions.length > 0) {
    status = 'READY_WITH_CONDITIONS';
    statusLabel = 'Document Readiness: Ready with Conditions';
    isReadyForActivation = true;
  } else {
    status = 'READY';
    statusLabel = 'Mock Site Activation Ready';
    isReadyForActivation = true;
  }

  return {
    studyId,
    siteId,
    evaluationDate: evalDate,
    protocolVersion: activeProtocolVersion,
    status,
    statusLabel,
    isReadyForActivation,
    totalRequired: CORE_STARTUP_REQUIREMENT_CHECKS.length,
    approvedCount,
    pendingReviewCount,
    missingCount: missingRequiredTypes.length,
    expiredCount,
    expiringSoonCount,
    blockingIssues,
    conditions,
    warnings,
    categoryBreakdown: categoryStats,
    missingRequiredTypes,
  };
}

/**
 * Fixture generator for negative and conditional testing variants (Variants A through H)
 */
export function createReadinessTestVariant(
  variant:
    | 'VARIANT_A_BASELINE'
    | 'VARIANT_B_MISSING_ETHICS'
    | 'VARIANT_C_EXPIRED_INSURANCE'
    | 'VARIANT_D_PROTOCOL_MISMATCH'
    | 'VARIANT_E_REJECTED_CTA'
    | 'VARIANT_F_CONDITIONAL_MET'
    | 'VARIANT_F_CONDITIONAL_UNMET'
    | 'VARIANT_G_MISSING_PI_GCP'
    | 'VARIANT_H_EMPTY_STORE',
  baseDocuments: Document[] = []
): { documents: Document[]; activeProtocolVersion: string; options?: SiteActivationOptions } {
  const cloned = structuredClone(baseDocuments);

  switch (variant) {
    case 'VARIANT_A_BASELINE':
      return {
        documents: cloned,
        activeProtocolVersion: '1.1',
        options: { evaluationDate: '2026-09-29' },
      };

    case 'VARIANT_B_MISSING_ETHICS':
      return {
        documents: cloned.filter((d) => d.id !== 'DOC-BNDL-02' && !/Ethics Committee.*Approval/i.test(d.title)),
        activeProtocolVersion: '1.1',
        options: { evaluationDate: '2026-09-29' },
      };

    case 'VARIANT_C_EXPIRED_INSURANCE': {
      const docs = cloned.map((d) => {
        if (d.id === 'DOC-BNDL-23' || /Insurance/i.test(d.title)) {
          return {
            ...d,
            status: 'EXPIRED' as const,
            expiryDate: '2026-09-01', // expired before 2026-09-29
          };
        }
        return d;
      });
      return {
        documents: docs,
        activeProtocolVersion: '1.1',
        options: { evaluationDate: '2026-09-29' },
      };
    }

    case 'VARIANT_D_PROTOCOL_MISMATCH': {
      // Remove v1.1, keep only v1.0 (SUPERSEDED)
      const docs = cloned.filter((d) => d.id !== 'DOC-BNDL-07');
      return {
        documents: docs,
        activeProtocolVersion: '1.1',
        options: { evaluationDate: '2026-09-29' },
      };
    }

    case 'VARIANT_E_REJECTED_CTA': {
      const docs = cloned.map((d) => {
        if (d.id === 'DOC-BNDL-22' || /CTA/i.test(d.title)) {
          return {
            ...d,
            reviewStatus: 'REJECTED' as const,
            rejectionReason: 'Indemnification clause non-compliant with AIIA institutional legal standard.',
          };
        }
        return d;
      });
      return {
        documents: docs,
        activeProtocolVersion: '1.1',
        options: { evaluationDate: '2026-09-29' },
      };
    }

    case 'VARIANT_F_CONDITIONAL_MET':
      return {
        documents: cloned,
        activeProtocolVersion: '1.1',
        options: { evaluationDate: '2026-09-29', requireColdChain: true },
      };

    case 'VARIANT_F_CONDITIONAL_UNMET': {
      const docs = cloned.filter((d) => d.id !== 'DOC-BNDL-33');
      return {
        documents: docs,
        activeProtocolVersion: '1.1',
        options: { evaluationDate: '2026-09-29', requireColdChain: true },
      };
    }

    case 'VARIANT_G_MISSING_PI_GCP': {
      const docs = cloned.filter((d) => d.id !== 'DOC-BNDL-14');
      return {
        documents: docs,
        activeProtocolVersion: '1.1',
        options: { evaluationDate: '2026-09-29' },
      };
    }

    case 'VARIANT_H_EMPTY_STORE':
      return {
        documents: [],
        activeProtocolVersion: '1.1',
        options: { evaluationDate: '2026-09-29' },
      };

    default:
      return {
        documents: cloned,
        activeProtocolVersion: '1.1',
        options: { evaluationDate: '2026-09-29' },
      };
  }
}
