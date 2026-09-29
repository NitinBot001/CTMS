import {
  IVisitDataRepository,
  ParticipantQueryContext,
  WorkflowActor,
  CreateDraftRecordInput,
} from './interfaces';
import {
  VisitDataRecord,
  VisitDataFilters,
  VisitDataField,
  VisitAttachment,
  ReviewNote,
  ReviewNoteType,
  VerificationAction,
  DataEntrySummaryMetrics,
} from '../types';
import { MOCK_VISIT_DATA_RECORDS } from '../data/mockData';
import {
  isValidTransition,
  calculateDataEntrySummaryMetrics,
  filterVisitDataRecords,
} from '../utils/visitDataCalculations';

export class MockVisitDataRepository implements IVisitDataRepository {
  private records: VisitDataRecord[];
  private onSaveRecords?: (records: VisitDataRecord[]) => void;

  constructor(initialRecords?: VisitDataRecord[], onSaveRecords?: (records: VisitDataRecord[]) => void) {
    this.records = initialRecords ? structuredClone(initialRecords) : structuredClone(MOCK_VISIT_DATA_RECORDS);
    this.onSaveRecords = onSaveRecords;
  }

  private notifySave(): void {
    this.onSaveRecords?.(this.records);
  }

  /**
   * Reset repository state for isolated automated testing
   */
  public resetForTesting(): void {
    this.records = structuredClone(MOCK_VISIT_DATA_RECORDS);
    this.notifySave();
  }

  private findScopedRecord(context: ParticipantQueryContext, recordId: string): VisitDataRecord {
    const record = this.records.find(
      (r) => r.id === recordId && r.studyId === context.studyId && r.siteId === context.siteId
    );
    if (!record) {
      throw new Error(`Visit data record "${recordId}" not found for study ${context.studyId} and site ${context.siteId}`);
    }
    return record;
  }

  async getRecord(
    context: ParticipantQueryContext,
    recordId: string
  ): Promise<VisitDataRecord | null> {
    if (!context.studyId || !context.siteId || !recordId) {
      return null;
    }
    const record = this.records.find(
      (r) => r.id === recordId && r.studyId === context.studyId && r.siteId === context.siteId
    );
    return record ? structuredClone(record) : null;
  }

  async listRecords(
    context: ParticipantQueryContext,
    filters?: VisitDataFilters
  ): Promise<VisitDataRecord[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    const scoped = this.records.filter(
      (r) => r.studyId === context.studyId && r.siteId === context.siteId
    );
    const filtered = filterVisitDataRecords(scoped, filters);
    return structuredClone(filtered);
  }

  async getDataEntryQueue(
    context: ParticipantQueryContext
  ): Promise<VisitDataRecord[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    const scoped = this.records.filter(
      (r) =>
        r.studyId === context.studyId &&
        r.siteId === context.siteId &&
        (r.status === 'DRAFT' || r.status === 'RETURNED_FOR_CORRECTION')
    );
    return structuredClone(scoped);
  }

  async getVerificationQueue(
    context: ParticipantQueryContext
  ): Promise<VisitDataRecord[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    const scoped = this.records.filter(
      (r) =>
        r.studyId === context.studyId &&
        r.siteId === context.siteId &&
        (r.status === 'SUBMITTED_FOR_VERIFICATION' || r.status === 'RESUBMITTED_FOR_VERIFICATION')
    );
    return structuredClone(scoped);
  }

  async createDraft(
    context: ParticipantQueryContext,
    input: CreateDraftRecordInput,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const id = `VDR-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const defaultFields: VisitDataField[] = [
      {
        id: `FLD-${id}-01`,
        recordId: id,
        category: 'VISIT_INFO',
        fieldKey: 'visitDate',
        label: 'Visit Date',
        value: input.visitDate || now.slice(0, 10),
        sourceReference: 'CRF Header Page 1',
        updatedAt: now,
      },
      {
        id: `FLD-${id}-02`,
        recordId: id,
        category: 'VITALS',
        fieldKey: 'temperature',
        label: 'Body Temperature',
        value: '',
        unit: '°F',
        sourceReference: 'Vitals Chart',
        updatedAt: now,
      },
      {
        id: `FLD-${id}-03`,
        recordId: id,
        category: 'VITALS',
        fieldKey: 'pulse',
        label: 'Pulse Rate',
        value: '',
        unit: 'bpm',
        sourceReference: 'Vitals Chart',
        updatedAt: now,
      },
      {
        id: `FLD-${id}-04`,
        recordId: id,
        category: 'VITALS',
        fieldKey: 'bloodPressure',
        label: 'Blood Pressure',
        value: '',
        unit: 'mmHg',
        sourceReference: 'Vitals Chart',
        updatedAt: now,
      },
      {
        id: `FLD-${id}-05`,
        recordId: id,
        category: 'VITALS',
        fieldKey: 'respiratoryRate',
        label: 'Respiratory Rate',
        value: '',
        unit: 'breaths/min',
        sourceReference: 'Vitals Chart',
        updatedAt: now,
      },
      {
        id: `FLD-${id}-06`,
        recordId: id,
        category: 'VITALS',
        fieldKey: 'weight',
        label: 'Weight',
        value: '',
        unit: 'kg',
        sourceReference: 'Anthropometry Log',
        updatedAt: now,
      },
      {
        id: `FLD-${id}-07`,
        recordId: id,
        category: 'VITALS',
        fieldKey: 'height',
        label: 'Height',
        value: '',
        unit: 'cm',
        sourceReference: 'Anthropometry Log',
        updatedAt: now,
      },
      {
        id: `FLD-${id}-08`,
        recordId: id,
        category: 'LAB_RESULTS',
        fieldKey: 'hemoglobin',
        label: 'Hemoglobin',
        value: '',
        unit: 'g/dL',
        sourceReference: 'CBC Report Page 1',
        updatedAt: now,
      },
      {
        id: `FLD-${id}-09`,
        recordId: id,
        category: 'OBSERVATIONS',
        fieldKey: 'clinicalNotes',
        label: 'Clinical Observations / Adverse Findings',
        value: '',
        sourceReference: 'Physician Progress Note',
        updatedAt: now,
      },
    ];

    let fields = defaultFields;
    if (input.fields && input.fields.length > 0) {
      fields = input.fields.map((f, idx) => ({
        id: f.id || `FLD-${id}-${String(idx + 1).padStart(2, '0')}`,
        recordId: id,
        category: f.category || 'OBSERVATIONS',
        fieldKey: f.fieldKey || `custom_${idx}`,
        label: f.label || `Field ${idx + 1}`,
        value: f.value || '',
        unit: f.unit,
        sourceReference: f.sourceReference || 'Source Document',
        flaggedForCorrection: f.flaggedForCorrection,
        flagReason: f.flagReason,
        updatedAt: now,
      }));
    }

    const creationAction: VerificationAction = {
      id: `VA-${Date.now()}-01`,
      recordId: id,
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRoleId: actor.roleId,
      actorRoleName: actor.roleName,
      action: 'CREATED',
      comment: 'Draft record initialized for clinical visit entry.',
      createdAt: now,
    };

    const newRecord: VisitDataRecord = {
      id,
      studyId: context.studyId,
      siteId: context.siteId,
      participantId: input.participantId,
      participantCode: input.participantCode,
      participantInitials: input.participantInitials,
      visitId: input.visitId,
      visitCode: input.visitCode,
      visitName: input.visitName,
      visitDate: input.visitDate || now.slice(0, 10),
      enteredByUserId: actor.userId,
      enteredByName: actor.name,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
      fields,
      attachments: [],
      reviewNotes: [],
      history: [creationAction],
    };

    this.records.unshift(newRecord);
    this.notifySave();
    return structuredClone(newRecord);
  }

  async updateField(
    context: ParticipantQueryContext,
    recordId: string,
    fieldUpdate: Partial<VisitDataField> & { fieldKey: string; label: string; value: string },
    _actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    if (record.status !== 'DRAFT' && record.status !== 'RETURNED_FOR_CORRECTION') {
      throw new Error(`Record is locked for editing in status: ${record.status}. Only DRAFT and RETURNED_FOR_CORRECTION records can be modified.`);
    }

    const now = new Date().toISOString();
    const existingFieldIdx = record.fields.findIndex((f) => f.fieldKey === fieldUpdate.fieldKey);

    if (existingFieldIdx >= 0) {
      record.fields[existingFieldIdx] = {
        ...record.fields[existingFieldIdx],
        ...fieldUpdate,
        value: fieldUpdate.value,
        updatedAt: now,
      };
    } else {
      record.fields.push({
        id: fieldUpdate.id || `FLD-${record.id}-${Date.now().toString().slice(-4)}`,
        recordId: record.id,
        category: fieldUpdate.category || 'OBSERVATIONS',
        fieldKey: fieldUpdate.fieldKey,
        label: fieldUpdate.label,
        value: fieldUpdate.value,
        unit: fieldUpdate.unit,
        sourceReference: fieldUpdate.sourceReference || 'Source Document',
        flaggedForCorrection: fieldUpdate.flaggedForCorrection,
        flagReason: fieldUpdate.flagReason,
        updatedAt: now,
      });
    }

    record.updatedAt = now;
    this.notifySave();
    return structuredClone(record);
  }

  async updateRecordFields(
    context: ParticipantQueryContext,
    recordId: string,
    fields: Partial<VisitDataField>[],
    _actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    if (record.status !== 'DRAFT' && record.status !== 'RETURNED_FOR_CORRECTION') {
      throw new Error(`Record is locked for editing in status: ${record.status}. Only DRAFT and RETURNED_FOR_CORRECTION records can be modified.`);
    }

    const now = new Date().toISOString();
    for (const f of fields) {
      if (!f.fieldKey) continue;
      const idx = record.fields.findIndex((ef) => ef.fieldKey === f.fieldKey);
      if (idx >= 0) {
        record.fields[idx] = {
          ...record.fields[idx],
          ...f,
          updatedAt: now,
        };
      } else {
        record.fields.push({
          id: f.id || `FLD-${record.id}-${Date.now().toString().slice(-4)}`,
          recordId: record.id,
          category: f.category || 'OBSERVATIONS',
          fieldKey: f.fieldKey,
          label: f.label || f.fieldKey,
          value: f.value || '',
          unit: f.unit,
          sourceReference: f.sourceReference || 'Source Document',
          flaggedForCorrection: f.flaggedForCorrection,
          flagReason: f.flagReason,
          updatedAt: now,
        });
      }
    }

    record.updatedAt = now;
    this.notifySave();
    return structuredClone(record);
  }

  async uploadAttachment(
    context: ParticipantQueryContext,
    recordId: string,
    attachment: Omit<VisitAttachment, 'id' | 'recordId' | 'uploadedAt'>,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    if (record.status !== 'DRAFT' && record.status !== 'RETURNED_FOR_CORRECTION') {
      throw new Error(`Cannot upload attachments when record is in status: ${record.status}. Only editable records permit new uploads.`);
    }

    const now = new Date().toISOString();
    const newAttachment: VisitAttachment = {
      id: `ATT-${Date.now().toString().slice(-6)}`,
      recordId: record.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType || 'application/pdf',
      size: attachment.size || 1024,
      storageReference: attachment.storageReference || `/mock-source-docs/${record.participantCode}-${attachment.fileName}`,
      uploadedByUserId: actor.userId,
      uploadedByName: actor.name,
      uploadedAt: now,
      description: attachment.description || attachment.notes,
      documentType: attachment.documentType,
      fileType: attachment.fileType || attachment.mimeType,
      fileSize: attachment.fileSize || attachment.size,
      fileUrl: attachment.fileUrl || attachment.storageReference,
      uploadedBy: actor.name,
      notes: attachment.notes,
    };

    record.attachments.push(newAttachment);
    record.updatedAt = now;

    record.history.push({
      id: `VA-${Date.now().toString().slice(-6)}`,
      recordId: record.id,
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRoleId: actor.roleId,
      actorRoleName: actor.roleName,
      action: 'ATTACHMENT_ADDED',
      comment: `Uploaded source document: ${attachment.fileName} (${attachment.documentType || 'Source Record'})`,
      createdAt: now,
    });

    this.notifySave();
    return structuredClone(record);
  }

  async removeAttachment(
    context: ParticipantQueryContext,
    recordId: string,
    attachmentId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    if (record.status !== 'DRAFT' && record.status !== 'RETURNED_FOR_CORRECTION') {
      throw new Error(`Cannot remove attachments when record is in status: ${record.status}.`);
    }

    const target = record.attachments.find((a) => a.id === attachmentId);
    if (!target) {
      throw new Error(`Attachment "${attachmentId}" not found in record ${recordId}.`);
    }

    record.attachments = record.attachments.filter((a) => a.id !== attachmentId);
    const now = new Date().toISOString();
    record.updatedAt = now;

    record.history.push({
      id: `VA-${Date.now().toString().slice(-6)}`,
      recordId: record.id,
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRoleId: actor.roleId,
      actorRoleName: actor.roleName,
      action: 'UPDATED',
      comment: `Removed source attachment: ${target.fileName}`,
      createdAt: now,
    });

    this.notifySave();
    return structuredClone(record);
  }

  async submitForVerification(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    if (!isValidTransition(record.status, 'SUBMITTED_FOR_VERIFICATION')) {
      throw new Error(`Invalid status transition from "${record.status}" to "SUBMITTED_FOR_VERIFICATION".`);
    }

    const now = new Date().toISOString();
    record.status = 'SUBMITTED_FOR_VERIFICATION';
    record.submittedAt = now;
    record.updatedAt = now;

    record.history.push({
      id: `VA-${Date.now().toString().slice(-6)}`,
      recordId: record.id,
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRoleId: actor.roleId,
      actorRoleName: actor.roleName,
      action: 'SUBMITTED_FOR_VERIFICATION',
      comment: 'Submitted for Sub-Investigator clinical verification against source documents.',
      createdAt: now,
    });

    this.notifySave();
    return structuredClone(record);
  }

  async returnForCorrection(
    context: ParticipantQueryContext,
    recordId: string,
    reason: string,
    affectedFields: string[] | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    if (!reason || !reason.trim()) {
      throw new Error('Return reason is mandatory when returning a record for correction.');
    }

    if (!isValidTransition(record.status, 'RETURNED_FOR_CORRECTION')) {
      throw new Error(`Invalid status transition from "${record.status}" to "RETURNED_FOR_CORRECTION".`);
    }

    const now = new Date().toISOString();
    record.status = 'RETURNED_FOR_CORRECTION';
    record.returnReason = reason.trim();
    record.returnAffectedFields = affectedFields || [];
    record.returnedAt = now;
    record.returnedBy = actor.name;
    record.updatedAt = now;

    // Flag affected fields
    if (affectedFields && affectedFields.length > 0) {
      record.fields = record.fields.map((f) => {
        if (affectedFields.includes(f.fieldKey) || affectedFields.includes(f.id)) {
          return {
            ...f,
            flaggedForCorrection: true,
            flagReason: reason.trim(),
          };
        }
        return f;
      });
    }

    record.history.push({
      id: `VA-${Date.now().toString().slice(-6)}`,
      recordId: record.id,
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRoleId: actor.roleId,
      actorRoleName: actor.roleName,
      action: 'RETURNED_FOR_CORRECTION',
      reason: reason.trim(),
      comment: reason.trim(),
      affectedFields: affectedFields || [],
      createdAt: now,
    });

    this.notifySave();
    return structuredClone(record);
  }

  async resubmitForVerification(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    if (!isValidTransition(record.status, 'RESUBMITTED_FOR_VERIFICATION')) {
      throw new Error(`Invalid status transition from "${record.status}" to "RESUBMITTED_FOR_VERIFICATION".`);
    }

    const now = new Date().toISOString();
    record.status = 'RESUBMITTED_FOR_VERIFICATION';
    record.resubmittedAt = now;
    record.updatedAt = now;

    // Clear field-level flags
    record.fields = record.fields.map((f) => {
      if (f.flaggedForCorrection) {
        return {
          ...f,
          flaggedForCorrection: false,
          flagReason: undefined,
        };
      }
      return f;
    });

    record.history.push({
      id: `VA-${Date.now().toString().slice(-6)}`,
      recordId: record.id,
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRoleId: actor.roleId,
      actorRoleName: actor.roleName,
      action: 'RESUBMITTED_FOR_VERIFICATION',
      comment: 'Resubmitted after addressing requested corrections.',
      createdAt: now,
    });

    this.notifySave();
    return structuredClone(record);
  }

  async verifyRecord(
    context: ParticipantQueryContext,
    recordId: string,
    comment: string | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    // Self-verification defense check
    if (actor.userId === record.enteredByUserId) {
      throw new Error('Self-verification is strictly prohibited. Verifier cannot be the data entry operator who entered the record.');
    }

    if (!isValidTransition(record.status, 'VERIFIED')) {
      throw new Error(`Invalid status transition from "${record.status}" to "VERIFIED". Only submitted or resubmitted records can be verified.`);
    }

    const now = new Date().toISOString();
    record.status = 'VERIFIED';
    record.verifiedAt = now;
    record.verifiedByUserId = actor.userId;
    record.verifiedByName = actor.name;
    record.updatedAt = now;

    record.history.push({
      id: `VA-${Date.now().toString().slice(-6)}`,
      recordId: record.id,
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRoleId: actor.roleId,
      actorRoleName: actor.roleName,
      action: 'VERIFIED',
      comment: comment || 'Verified against source document. Clinical entries confirmed accurate.',
      createdAt: now,
    });

    this.notifySave();
    return structuredClone(record);
  }

  async moveToPiReview(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    if (!isValidTransition(record.status, 'PI_REVIEW')) {
      throw new Error(`Invalid status transition from "${record.status}" to "PI_REVIEW".`);
    }

    const now = new Date().toISOString();
    record.status = 'PI_REVIEW';
    record.piReviewedAt = now;
    record.updatedAt = now;

    record.history.push({
      id: `VA-${Date.now().toString().slice(-6)}`,
      recordId: record.id,
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRoleId: actor.roleId,
      actorRoleName: actor.roleName,
      action: 'PI_REVIEWED',
      comment: 'Record queued for Principal Investigator review and sign-off.',
      createdAt: now,
    });

    this.notifySave();
    return structuredClone(record);
  }

  async submitToCro(
    context: ParticipantQueryContext,
    recordId: string,
    comment: string | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    if (!isValidTransition(record.status, 'SUBMITTED_TO_CRO')) {
      throw new Error(`Invalid status transition from "${record.status}" to "SUBMITTED_TO_CRO".`);
    }

    const now = new Date().toISOString();
    record.status = 'SUBMITTED_TO_CRO';
    record.submittedToCroAt = now;
    record.croSubmittedAt = now;
    record.croBatchReference = `CRO-${context.studyId}-${Date.now().toString().slice(-6)}`;
    record.updatedAt = now;

    record.history.push({
      id: `VA-${Date.now().toString().slice(-6)}`,
      recordId: record.id,
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRoleId: actor.roleId,
      actorRoleName: actor.roleName,
      action: 'SUBMITTED_TO_CRO',
      comment: comment || `Formally released to CRO / Data Management under batch ${record.croBatchReference}.`,
      createdAt: now,
    });

    this.notifySave();
    return structuredClone(record);
  }

  async addReviewNote(
    context: ParticipantQueryContext,
    recordId: string,
    note: { type: ReviewNoteType; message: string },
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    const record = this.findScopedRecord(context, recordId);

    if (!note.message || !note.message.trim()) {
      throw new Error('Review note message cannot be empty.');
    }

    const now = new Date().toISOString();
    const newNote: ReviewNote = {
      id: `RN-${Date.now().toString().slice(-6)}`,
      studyId: context.studyId,
      siteId: context.siteId,
      recordId: record.id,
      authorUserId: actor.userId,
      authorName: actor.name,
      authorRoleId: actor.roleId,
      authorRoleName: actor.roleName,
      type: note.type,
      message: note.message.trim(),
      createdAt: now,
    };

    record.reviewNotes.push(newNote);
    record.updatedAt = now;

    record.history.push({
      id: `VA-${Date.now().toString().slice(-6)}`,
      recordId: record.id,
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRoleId: actor.roleId,
      actorRoleName: actor.roleName,
      action: 'REVIEW_NOTE_ADDED',
      comment: `[${note.type}] ${note.message.trim()}`,
      createdAt: now,
    });

    this.notifySave();
    return structuredClone(record);
  }

  async getReviewHistory(
    context: ParticipantQueryContext,
    recordId: string
  ): Promise<ReviewNote[]> {
    const record = this.findScopedRecord(context, recordId);
    return structuredClone(record.reviewNotes);
  }

  async getVerificationHistory(
    context: ParticipantQueryContext,
    recordId: string
  ): Promise<VerificationAction[]> {
    const record = this.findScopedRecord(context, recordId);
    return structuredClone(record.history);
  }

  async getSummaryMetrics(
    context: ParticipantQueryContext
  ): Promise<DataEntrySummaryMetrics> {
    if (!context.studyId || !context.siteId) {
      return {
        pendingDataEntry: 0,
        enteredToday: 0,
        pendingVerification: 0,
        returnedForCorrection: 0,
        documentsPending: 0,
        verified: 0,
        totalRecords: 0,
      };
    }
    const scoped = this.records.filter(
      (r) => r.studyId === context.studyId && r.siteId === context.siteId
    );
    return calculateDataEntrySummaryMetrics(scoped);
  }
}

export const mockVisitDataRepository = new MockVisitDataRepository();
