import {
  IVisitDataRepository,
  ParticipantQueryContext,
  WorkflowActor,
  CreateDraftRecordInput,
} from '../repositories/interfaces';
import { environmentService } from './environmentService';
import {
  VisitDataRecord,
  VisitDataFilters,
  VisitDataField,
  VisitAttachment,
  ReviewNote,
  ReviewNoteType,
  VerificationAction,
  DataEntrySummaryMetrics,
  Permission,
} from '../types';

export class VisitDataService {
  private _customRepo?: IVisitDataRepository;

  constructor(repository?: IVisitDataRepository) {
    this._customRepo = repository;
  }

  private get repo(): IVisitDataRepository {
    return this._customRepo || environmentService.getVisitDataRepository();
  }

  async getRecord(
    context: ParticipantQueryContext,
    recordId: string
  ): Promise<VisitDataRecord | null> {
    if (!context.studyId || !context.siteId || !recordId) {
      return null;
    }
    return this.repo.getRecord(context, recordId);
  }

  async listRecords(
    context: ParticipantQueryContext,
    filters?: VisitDataFilters
  ): Promise<VisitDataRecord[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.listRecords(context, filters);
  }

  async getDataEntryQueue(
    context: ParticipantQueryContext
  ): Promise<VisitDataRecord[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getDataEntryQueue(context);
  }

  async getVerificationQueue(
    context: ParticipantQueryContext
  ): Promise<VisitDataRecord[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getVerificationQueue(context);
  }

  async createDraft(
    context: ParticipantQueryContext,
    record: CreateDraftRecordInput,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.createDraft(context, record, actor);
  }

  async updateField(
    context: ParticipantQueryContext,
    recordId: string,
    field: Partial<VisitDataField> & { fieldKey: string; label: string; value: string },
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.updateField(context, recordId, field, actor);
  }

  async updateRecordFields(
    context: ParticipantQueryContext,
    recordId: string,
    fields: Partial<VisitDataField>[],
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.updateRecordFields(context, recordId, fields, actor);
  }

  async uploadAttachment(
    context: ParticipantQueryContext,
    recordId: string,
    attachment: Omit<VisitAttachment, 'id' | 'recordId' | 'uploadedAt'>,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.uploadAttachment(context, recordId, attachment, actor);
  }

  async removeAttachment(
    context: ParticipantQueryContext,
    recordId: string,
    attachmentId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.removeAttachment(context, recordId, attachmentId, actor);
  }

  async submitForVerification(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.submitForVerification(context, recordId, actor);
  }

  async returnForCorrection(
    context: ParticipantQueryContext,
    recordId: string,
    reason: string,
    affectedFields: string[] | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.returnForCorrection(context, recordId, reason, affectedFields, actor);
  }

  async resubmitForVerification(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.resubmitForVerification(context, recordId, actor);
  }

  async verifyRecord(
    context: ParticipantQueryContext,
    recordId: string,
    comment: string | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.verifyRecord(context, recordId, comment, actor);
  }

  async moveToPiReview(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.moveToPiReview(context, recordId, actor);
  }

  async submitToCro(
    context: ParticipantQueryContext,
    recordId: string,
    comment: string | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.submitToCro(context, recordId, comment, actor);
  }

  async addReviewNote(
    context: ParticipantQueryContext,
    recordId: string,
    note: { type: ReviewNoteType; message: string },
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.addReviewNote(context, recordId, note, actor);
  }

  async getReviewHistory(
    context: ParticipantQueryContext,
    recordId: string
  ): Promise<ReviewNote[]> {
    return this.repo.getReviewHistory(context, recordId);
  }

  async getVerificationHistory(
    context: ParticipantQueryContext,
    recordId: string
  ): Promise<VerificationAction[]> {
    return this.repo.getVerificationHistory(context, recordId);
  }

  async getSummaryMetrics(
    context: ParticipantQueryContext
  ): Promise<DataEntrySummaryMetrics> {
    return this.repo.getSummaryMetrics(context);
  }

  // -------------------------------------------------------------
  // Permission & Capability Helper Checks
  // -------------------------------------------------------------

  canEditRecord(record: VisitDataRecord, permissions: Permission[]): boolean {
    const hasPermission = permissions.some((p) => p.id === 'DATA_ENTRY_EDIT');
    if (!hasPermission) return false;
    return record.status === 'DRAFT' || record.status === 'RETURNED_FOR_CORRECTION';
  }

  canSubmitRecord(record: VisitDataRecord, permissions: Permission[]): boolean {
    const hasPermission = permissions.some((p) => p.id === 'DATA_ENTRY_SUBMIT');
    if (!hasPermission) return false;
    return record.status === 'DRAFT' || record.status === 'RETURNED_FOR_CORRECTION';
  }

  canVerifyRecord(record: VisitDataRecord, userId: string, permissions: Permission[]): boolean {
    const hasPermission = permissions.some((p) => p.id === 'DATA_ENTRY_VERIFY');
    if (!hasPermission) return false;
    // Self-verification check
    if (record.enteredByUserId === userId) return false;
    return (
      record.status === 'SUBMITTED_FOR_VERIFICATION' ||
      record.status === 'RESUBMITTED_FOR_VERIFICATION'
    );
  }

  canReturnRecord(record: VisitDataRecord, permissions: Permission[]): boolean {
    const hasPermission = permissions.some((p) => p.id === 'DATA_ENTRY_RETURN');
    if (!hasPermission) return false;
    return (
      record.status === 'SUBMITTED_FOR_VERIFICATION' ||
      record.status === 'RESUBMITTED_FOR_VERIFICATION'
    );
  }

  canAddReviewNote(permissions: Permission[]): boolean {
    return permissions.some((p) => p.id === 'DATA_ENTRY_NOTE');
  }

  canSubmitToCro(record: VisitDataRecord, permissions: Permission[]): boolean {
    const hasPermission = permissions.some((p) => p.id === 'DATA_ENTRY_CRO_SUBMIT');
    if (!hasPermission) return false;
    return record.status === 'VERIFIED' || record.status === 'PI_REVIEW';
  }
}

export const visitDataService = new VisitDataService();
