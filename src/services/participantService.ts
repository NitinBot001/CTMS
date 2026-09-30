import { IParticipantRepository, ParticipantQueryContext, WorkflowActor } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import {
  Participant,
  ParticipantFilters,
  ParticipantSummaryMetrics,
  CreateParticipantInput,
  ParticipantOnboardingRequest,
  ReviewOnboardingRequestInput,
  ParticipantRequest,
  CreateParticipantRequestInput,
  ReviewParticipantRequestInput,
  ParticipantSelfRegistrationInput,
} from '../types';
import { auditService } from './auditService';
import { participantNumberService } from './participantNumberService';
import { visitService } from './visitService';
import { notificationService } from './notificationService';

export class ParticipantService {
  private _customRepo?: IParticipantRepository;

  constructor(repository?: IParticipantRepository) {
    this._customRepo = repository;
  }

  private get repo(): IParticipantRepository {
    return this._customRepo || environmentService.getParticipantRepository();
  }

  async getParticipants(
    context: ParticipantQueryContext,
    filters?: ParticipantFilters
  ): Promise<Participant[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getParticipants(context, filters);
  }

  async getParticipant(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<Participant | null> {
    if (!context.studyId || !context.siteId || !participantId) {
      return null;
    }
    return this.repo.getParticipantById(context, participantId);
  }

  async getParticipantSummary(context: ParticipantQueryContext): Promise<ParticipantSummaryMetrics> {
    if (!context.studyId || !context.siteId) {
      return {
        total: 0,
        screening: 0,
        enrolled: 0,
        active: 0,
        completed: 0,
        withdrawn: 0,
        screenFailed: 0,
        attentionRequired: 0,
      };
    }
    return this.repo.getParticipantSummary(context);
  }

  async createParticipant(
    context: ParticipantQueryContext,
    input: CreateParticipantInput,
    actor?: WorkflowActor
  ): Promise<Participant> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are required to onboard a participant.');
    }

    // Role Authority Enforcement:
    // Only users with PARTICIPANTS_CREATE (e.g. CRC) can create participants.
    // PI, Sub-I, Nurse, Pharmacist, and Data Entry are explicitly restricted.
    if (actor) {
      const allowed =
        actor.effectivePermissions?.includes('PARTICIPANTS_CREATE') ||
        actor.role === 'ROLE_CRC';
      if (!allowed) {
        throw new Error('You do not have permission to create participants.');
      }
    }

    // Field validations
    if (!input.studyId || !input.studyId.trim()) {
      throw new Error('Study ID is required.');
    }
    if (!input.siteId || !input.siteId.trim()) {
      throw new Error('Site ID is required.');
    }
    if (!input.screeningNumber || !input.screeningNumber.trim()) {
      throw new Error('Screening number is required.');
    }
    if (!input.initials || !input.initials.trim()) {
      throw new Error('Participant initials are required.');
    }
    if (input.demographics && input.demographics.age <= 0) {
      throw new Error('Participant age must be greater than zero.');
    }

    // Duplicate screening code check
    const existing = await this.repo.getParticipants(context);
    const dupScreening = existing.some(
      (p) => p.screeningCode.trim().toLowerCase() === input.screeningNumber.trim().toLowerCase()
    );
    if (dupScreening) {
      throw new Error(`Screening code "${input.screeningNumber}" already exists at this site.`);
    }

    if (input.participantCode && input.participantCode.trim()) {
      const dupCode = existing.some(
        (p) =>
          p.participantCode.trim().toLowerCase() === input.participantCode!.trim().toLowerCase() ||
          (p.participantNumber && p.participantNumber.trim().toLowerCase() === input.participantCode!.trim().toLowerCase())
      );
      if (dupCode) {
        throw new Error(`Participant code "${input.participantCode}" already exists at this site.`);
      }
    }

    const created = await this.repo.createParticipant(context, input);

    // Audit Logging
    await auditService.logEvent({
      actorUserId: actor?.userId || 'SYSTEM_OPERATOR',
      actorRole: actor?.role || 'ROLE_CRC',
      studyId: context.studyId,
      siteId: context.siteId,
      targetEntity: 'PARTICIPANT',
      action: 'PARTICIPANT_CREATED',
      metadata: {
        participantId: created.id,
        participantCode: created.participantCode,
        screeningCode: created.screeningCode,
      },
    });

    return created;
  }

  async updateParticipant(
    context: ParticipantQueryContext,
    participantId: string,
    updates: Partial<Participant>,
    actor?: WorkflowActor
  ): Promise<Participant | null> {
    if (!context.studyId || !context.siteId || !participantId) {
      throw new Error('Study, site, and participant ID are required.');
    }

    // Role Authority Enforcement:
    // Only users with PARTICIPANTS_EDIT (e.g. CRC, PI) or participant self-edit can update
    if (actor) {
      const canEdit =
        actor.effectivePermissions?.includes('PARTICIPANTS_EDIT') ||
        actor.effectivePermissions?.includes('PARTICIPANT_SELF_EDIT') ||
        actor.role === 'ROLE_CRC' ||
        actor.role === 'ROLE_PI';
      if (!canEdit) {
        throw new Error('You do not have permission to edit participant details.');
      }
    }

    if (!this.repo.updateParticipant) {
      throw new Error('Participant update not supported by current repository.');
    }

    const updated = await this.repo.updateParticipant(context, participantId, updates);
    if (updated) {
      await auditService.logEvent({
        actorUserId: actor?.userId || 'SYSTEM_OPERATOR',
        actorRole: actor?.role || 'ROLE_CRC',
        studyId: context.studyId,
        siteId: context.siteId,
        targetEntity: 'PARTICIPANT',
        action: 'PARTICIPANT_UPDATED',
        metadata: {
          participantId: updated.id,
          updatedFields: Object.keys(updates),
        },
      });
    }

    return updated;
  }

  // ============================================================
  // Onboarding Requests Workflow
  // ============================================================

  async getOnboardingRequests(
    context: ParticipantQueryContext
  ): Promise<ParticipantOnboardingRequest[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    if (!this.repo.getOnboardingRequests) {
      return [];
    }
    return this.repo.getOnboardingRequests(context);
  }

  async getOnboardingRequestById(
    context: ParticipantQueryContext,
    requestId: string
  ): Promise<ParticipantOnboardingRequest | null> {
    if (!context.studyId || !context.siteId || !requestId) {
      return null;
    }
    if (!this.repo.getOnboardingRequestById) {
      return null;
    }
    return this.repo.getOnboardingRequestById(context, requestId);
  }

  async createOnboardingRequest(
    input: ParticipantSelfRegistrationInput
  ): Promise<ParticipantOnboardingRequest> {
    if (!input.studyId || !input.siteId) {
      throw new Error('Study and site context are required for onboarding.');
    }
    if (!input.requestedEmail || !input.requestedEmail.includes('@')) {
      throw new Error('A valid email address is required.');
    }
    if (!input.requestedName || !input.requestedName.trim()) {
      throw new Error('Full applicant name is required.');
    }

    if (!this.repo.createOnboardingRequest) {
      throw new Error('Onboarding request creation not supported.');
    }

    const created = await this.repo.createOnboardingRequest(input);

    await auditService.logEvent({
      actorUserId: created.requestedEmail,
      actorRole: 'PARTICIPANT_CANDIDATE',
      studyId: input.studyId,
      siteId: input.siteId,
      targetEntity: 'ONBOARDING_REQUEST',
      action: 'ONBOARDING_REQUEST_SUBMITTED',
      metadata: {
        requestId: created.id,
        applicantName: created.requestedName,
        email: created.requestedEmail,
      },
    });

    return created;
  }

  async reviewOnboardingRequest(
    context: ParticipantQueryContext,
    requestId: string,
    review: ReviewOnboardingRequestInput,
    actor?: WorkflowActor,
    studyCode?: string
  ): Promise<ParticipantOnboardingRequest> {
    if (!context.studyId || !context.siteId || !requestId) {
      throw new Error('Context and requestId are required.');
    }

    // Role check: Only CRC or authorized role can review onboarding requests
    if (actor) {
      const canManage =
        actor.effectivePermissions?.includes('PARTICIPANTS_CREATE') ||
        actor.effectivePermissions?.includes('PARTICIPANTS_EDIT') ||
        actor.role === 'ROLE_CRC';
      if (!canManage) {
        throw new Error('You do not have permission to review participant onboarding requests.');
      }
    }

    const request = await this.getOnboardingRequestById(context, requestId);
    if (!request) {
      throw new Error(`Onboarding request "${requestId}" not found.`);
    }

    if (request.status === 'APPROVED' || request.status === 'REJECTED') {
      throw new Error(`Onboarding request is already ${request.status}.`);
    }

    if (review.decision === 'APPROVE') {
      // 1. Generate study-specific participant number
      const existing = await this.repo.getParticipants(context);
      const assignedNumber =
        review.participantNumber ||
        participantNumberService.generateNextNumber(studyCode || context.studyId, existing);

      // 2. Generate screening number
      const screeningNum = `SCR-${String(existing.length + 1).padStart(3, '0')}`;

      // 3. Create linked participant record
      const initials = request.requestedName
        .split(' ')
        .map((n) => n[0])
        .join('.')
        .toUpperCase();

      const newParticipant = await this.createParticipant(
        context,
        {
          studyId: context.studyId,
          siteId: context.siteId,
          screeningNumber: screeningNum,
          participantCode: assignedNumber,
          initials: initials || 'P.T.',
          demographics: {
            age: request.age || 30,
            gender: request.gender === 'MALE' ? 'MALE' : request.gender === 'FEMALE' ? 'FEMALE' : 'OTHER',
            dob: request.dob,
          },
          status: 'SCREENING',
          notes: request.notes,
        },
        actor
      );

      // 4. Update request status
      const updatedReq: ParticipantOnboardingRequest = {
        ...request,
        status: 'APPROVED',
        reviewedByUserId: actor?.userId || 'USR-CRC',
        reviewedByName: actor?.name || 'Study Coordinator',
        reviewedAt: new Date().toISOString(),
        participantId: newParticipant.id,
        participantNumber: assignedNumber,
        updatedAt: new Date().toISOString(),
      };

      if (!this.repo.updateOnboardingRequest) {
        throw new Error('Onboarding request update not supported.');
      }
      const saved = await this.repo.updateOnboardingRequest(updatedReq);

      // 5. Audit Log
      await auditService.logEvent({
        actorUserId: actor?.userId || 'USR-CRC',
        actorRole: actor?.role || 'ROLE_CRC',
        studyId: context.studyId,
        siteId: context.siteId,
        targetEntity: 'ONBOARDING_REQUEST',
        action: 'ONBOARDING_APPROVED',
        metadata: {
          requestId: saved.id,
          participantId: newParticipant.id,
          assignedParticipantNumber: assignedNumber,
        },
      });

      await auditService.logEvent({
        actorUserId: actor?.userId || 'USR-CRC',
        actorRole: actor?.role || 'ROLE_CRC',
        studyId: context.studyId,
        siteId: context.siteId,
        targetEntity: 'PARTICIPANT',
        action: 'PARTICIPANT_NUMBER_ASSIGNED',
        metadata: {
          participantId: newParticipant.id,
          assignedParticipantNumber: assignedNumber,
        },
      });

      if (request.participantAccountId) {
        await notificationService.createNotification(
          {
            studyId: context.studyId,
            siteId: context.siteId,
            recipientUserId: request.participantAccountId,
          },
          {
            studyId: context.studyId,
            siteId: context.siteId,
            recipientUserId: request.participantAccountId,
            title: 'Onboarding Approved',
            message: `Your onboarding application has been approved. Participant Number: ${assignedNumber}.`,
            type: 'PARTICIPANT_ONBOARDING_APPROVED',
            sourceEntityType: 'PARTICIPANT',
            priority: 'NORMAL',
            status: 'UNREAD',
          }
        );
      }

      return saved;
    } else if (review.decision === 'REQUEST_CLARIFICATION') {
      if (!review.reason || !review.reason.trim()) {
        throw new Error('Clarification reason is mandatory when requesting clarification.');
      }

      const updatedReq: ParticipantOnboardingRequest = {
        ...request,
        status: 'NEEDS_CLARIFICATION',
        decisionReason: review.reason.trim(),
        reviewedByUserId: actor?.userId || 'USR-CRC',
        reviewedByName: actor?.name || 'Study Coordinator',
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!this.repo.updateOnboardingRequest) {
        throw new Error('Onboarding request update not supported.');
      }
      const saved = await this.repo.updateOnboardingRequest(updatedReq);

      await auditService.logEvent({
        actorUserId: actor?.userId || 'USR-CRC',
        actorRole: actor?.role || 'ROLE_CRC',
        studyId: context.studyId,
        siteId: context.siteId,
        targetEntity: 'ONBOARDING_REQUEST',
        action: 'CLARIFICATION_REQUESTED',
        metadata: {
          requestId: saved.id,
          reason: review.reason,
        },
      });

      if (request.participantAccountId) {
        await notificationService.createNotification(
          {
            studyId: context.studyId,
            siteId: context.siteId,
            recipientUserId: request.participantAccountId,
          },
          {
            studyId: context.studyId,
            siteId: context.siteId,
            recipientUserId: request.participantAccountId,
            title: 'Clarification Requested',
            message: `Clarification requested on your onboarding: ${review.reason}`,
            type: 'PARTICIPANT_ONBOARDING_CLARIFICATION',
            sourceEntityType: 'PARTICIPANT',
            priority: 'HIGH',
            status: 'UNREAD',
          }
        );
      }

      return saved;
    } else if (review.decision === 'REJECT') {
      if (!review.reason || !review.reason.trim()) {
        throw new Error('Rejection reason is mandatory when rejecting onboarding.');
      }

      const updatedReq: ParticipantOnboardingRequest = {
        ...request,
        status: 'REJECTED',
        decisionReason: review.reason.trim(),
        reviewedByUserId: actor?.userId || 'USR-CRC',
        reviewedByName: actor?.name || 'Study Coordinator',
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!this.repo.updateOnboardingRequest) {
        throw new Error('Onboarding request update not supported.');
      }
      const saved = await this.repo.updateOnboardingRequest(updatedReq);

      await auditService.logEvent({
        actorUserId: actor?.userId || 'USR-CRC',
        actorRole: actor?.role || 'ROLE_CRC',
        studyId: context.studyId,
        siteId: context.siteId,
        targetEntity: 'ONBOARDING_REQUEST',
        action: 'ONBOARDING_REJECTED',
        metadata: {
          requestId: saved.id,
          reason: review.reason,
        },
      });

      if (request.participantAccountId) {
        await notificationService.createNotification(
          {
            studyId: context.studyId,
            siteId: context.siteId,
            recipientUserId: request.participantAccountId,
          },
          {
            studyId: context.studyId,
            siteId: context.siteId,
            recipientUserId: request.participantAccountId,
            title: 'Onboarding Rejected',
            message: `Your onboarding application was rejected: ${review.reason}`,
            type: 'PARTICIPANT_ONBOARDING_REJECTED',
            sourceEntityType: 'PARTICIPANT',
            priority: 'NORMAL',
            status: 'UNREAD',
          }
        );
      }

      return saved;
    }

    throw new Error(`Unsupported review decision: ${review.decision}`);
  }

  async resubmitOnboardingRequest(
    context: ParticipantQueryContext,
    requestId: string,
    updates: Partial<ParticipantOnboardingRequest>
  ): Promise<ParticipantOnboardingRequest> {
    const request = await this.getOnboardingRequestById(context, requestId);
    if (!request) {
      throw new Error(`Onboarding request "${requestId}" not found.`);
    }

    if (request.status !== 'NEEDS_CLARIFICATION') {
      throw new Error('Only requests with status NEEDS_CLARIFICATION can be resubmitted.');
    }

    const updated: ParticipantOnboardingRequest = {
      ...request,
      ...updates,
      id: request.id,
      studyId: request.studyId,
      siteId: request.siteId,
      status: 'SUBMITTED',
      decisionReason: undefined,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.repo.updateOnboardingRequest) {
      throw new Error('Onboarding request update not supported.');
    }

    const saved = await this.repo.updateOnboardingRequest(updated);

    await auditService.logEvent({
      actorUserId: saved.requestedEmail,
      actorRole: 'PARTICIPANT_CANDIDATE',
      studyId: context.studyId,
      siteId: context.siteId,
      targetEntity: 'ONBOARDING_REQUEST',
      action: 'ONBOARDING_REQUEST_RESUBMITTED',
      metadata: { requestId: saved.id },
    });

    return saved;
  }

  // ============================================================
  // Participant Requests (Cannot Attend / Reschedule)
  // ============================================================

  async getParticipantRequests(
    context: ParticipantQueryContext,
    participantId?: string
  ): Promise<ParticipantRequest[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    if (!this.repo.getParticipantRequests) {
      return [];
    }
    return this.repo.getParticipantRequests(context, participantId);
  }

  async createParticipantRequest(
    context: ParticipantQueryContext,
    input: CreateParticipantRequestInput,
    actor?: WorkflowActor
  ): Promise<ParticipantRequest> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are required.');
    }
    if (!input.message || !input.message.trim()) {
      throw new Error('Request message is required.');
    }

    if (!this.repo.createParticipantRequest) {
      throw new Error('Participant requests not supported.');
    }

    const created = await this.repo.createParticipantRequest(input);

    await auditService.logEvent({
      actorUserId: actor?.userId || input.participantId,
      actorRole: actor?.role || 'ROLE_PARTICIPANT',
      studyId: context.studyId,
      siteId: context.siteId,
      targetEntity: 'PARTICIPANT_REQUEST',
      action: 'PARTICIPANT_REQUEST_SUBMITTED',
      metadata: {
        requestId: created.id,
        participantId: created.participantId,
        requestType: created.requestType,
        visitId: created.visitId,
      },
    });

    return created;
  }

  async reviewParticipantRequest(
    context: ParticipantQueryContext,
    requestId: string,
    review: ReviewParticipantRequestInput,
    actor?: WorkflowActor
  ): Promise<ParticipantRequest> {
    if (!context.studyId || !context.siteId || !requestId) {
      throw new Error('Context and requestId are required.');
    }

    const allRequests = await this.getParticipantRequests(context);
    const found = allRequests.find((r) => r.id === requestId);
    if (!found) {
      throw new Error(`Participant request "${requestId}" not found.`);
    }

    if (review.decision === 'APPROVE') {
      // If reschedule request with new date and linked visit, update visit schedule
      if (found.requestType === 'RESCHEDULE_VISIT' && found.visitId && (review.newPlannedDate || found.proposedDate)) {
        const targetDate = review.newPlannedDate || found.proposedDate!;
        await visitService.updateVisit(context, found.visitId, {
          targetDate,
          windowStart: targetDate,
          windowEnd: targetDate,
        });

        await auditService.logEvent({
          actorUserId: actor?.userId || 'USR-CRC',
          actorRole: actor?.role || 'ROLE_CRC',
          studyId: context.studyId,
          siteId: context.siteId,
          targetEntity: 'VISIT',
          action: 'VISIT_RESCHEDULE_APPROVED',
          metadata: {
            visitId: found.visitId,
            rescheduledDate: targetDate,
            requestId: found.id,
          },
        });
      }

      const updatedReq: ParticipantRequest = {
        ...found,
        status: 'APPROVED',
        reviewedBy: actor?.userId || 'USR-CRC',
        reviewedByName: actor?.name || 'Study Coordinator',
        reviewedAt: new Date().toISOString(),
        reviewerComment: review.comment,
      };

      if (!this.repo.updateParticipantRequest) {
        throw new Error('Participant request update not supported.');
      }
      return this.repo.updateParticipantRequest(updatedReq);
    } else {
      const updatedReq: ParticipantRequest = {
        ...found,
        status: 'REJECTED',
        reviewedBy: actor?.userId || 'USR-CRC',
        reviewedByName: actor?.name || 'Study Coordinator',
        reviewedAt: new Date().toISOString(),
        reviewerComment: review.comment,
      };

      if (!this.repo.updateParticipantRequest) {
        throw new Error('Participant request update not supported.');
      }
      const saved = await this.repo.updateParticipantRequest(updatedReq);

      await auditService.logEvent({
        actorUserId: actor?.userId || 'USR-CRC',
        actorRole: actor?.role || 'ROLE_CRC',
        studyId: context.studyId,
        siteId: context.siteId,
        targetEntity: 'PARTICIPANT_REQUEST',
        action: 'VISIT_RESCHEDULE_REJECTED',
        metadata: { requestId: saved.id, comment: review.comment },
      });

      return saved;
    }
  }
}

export const participantService = new ParticipantService();
