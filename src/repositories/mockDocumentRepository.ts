import { IDocumentRepository, ParticipantQueryContext } from './interfaces';
import {
  Document,
  DocumentVersion,
  DocumentSummaryMetrics,
  DocumentFilters,
  CreateDocumentInput,
  CreateDocumentVersionInput,
  UpdateDocumentInput,
  DocumentExpiryState,
  User,
  UserRole,
} from '../types';
import {
  MOCK_DOCUMENTS,
  MOCK_USERS,
  MOCK_USER_ROLES,
} from '../data/mockData';
import {
  calculateDocumentExpiryState,
  deriveDocumentStatus,
  getDaysUntilExpiry,
  isDocumentActionRequired,
  DOCUMENT_REFERENCE_DATE,
} from '../utils/documentCalculations';

export class MockDocumentRepository implements IDocumentRepository {
  private documents: Document[];
  private users: User[];
  private userRoles: UserRole[];

  constructor() {
    this.documents = structuredClone(MOCK_DOCUMENTS);
    this.users = structuredClone(MOCK_USERS);
    this.userRoles = structuredClone(MOCK_USER_ROLES);
  }

  /**
   * Reset repository state for automated test isolation
   */
  public resetForTesting(): void {
    this.documents = structuredClone(MOCK_DOCUMENTS);
    this.users = structuredClone(MOCK_USERS);
    this.userRoles = structuredClone(MOCK_USER_ROLES);
  }

  /**
   * Validates that an assigned owner exists, is active, and is assigned to the current site/study
   */
  private validateSiteUser(context: ParticipantQueryContext, userId: string): User {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error(`User with ID "${userId}" does not exist.`);
    }

    if (user.status === 'INACTIVE') {
      throw new Error(`Cannot assign document ownership to inactive user: ${user.displayName}.`);
    }

    const hasSiteRole = this.userRoles.some(
      (ur) =>
        ur.userId === userId &&
        ur.studyId === context.studyId &&
        ur.siteId === context.siteId
    );

    if (!hasSiteRole) {
      throw new Error(
        `User "${user.displayName}" (${userId}) is not assigned to site ${context.siteId} in study ${context.studyId}.`
      );
    }

    return user;
  }

  /**
   * Retrieves documents scoped to the active study and site with multi-criteria filtering
   */
  async getDocuments(
    context: ParticipantQueryContext,
    filters?: DocumentFilters
  ): Promise<Document[]> {
    let result = this.documents.filter(
      (d) => d.studyId === context.studyId && d.siteId === context.siteId
    );

    if (!filters) {
      return structuredClone(result);
    }

    // 1. Text search across ID, title, description, document type, category, owner, and filenames
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          d.documentType.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          (d.ownerName && d.ownerName.toLowerCase().includes(q)) ||
          d.versions.some((v) => v.fileName.toLowerCase().includes(q))
      );
    }

    // 2. Category filter
    if (filters.category && filters.category !== 'ALL') {
      result = result.filter((d) => d.category === filters.category);
    }

    // 3. Document Type filter
    if (filters.documentType && filters.documentType !== 'ALL') {
      result = result.filter((d) => d.documentType === filters.documentType);
    }

    // 4. Status filter
    if (filters.status && filters.status !== 'ALL') {
      if (filters.status === 'ACTIVE_OR_EXPIRING') {
        result = result.filter(
          (d) => d.status === 'ACTIVE' || d.status === 'EXPIRING_SOON'
        );
      } else {
        result = result.filter((d) => d.status === filters.status);
      }
    }

    // 5. Expiry filter
    if (filters.expiryFilter && filters.expiryFilter !== 'ALL') {
      if (filters.expiryFilter === 'ACTIVE') {
        result = result.filter(
          (d) => calculateDocumentExpiryState(d) === 'ACTIVE'
        );
      } else if (filters.expiryFilter === 'EXPIRING_SOON') {
        result = result.filter(
          (d) => calculateDocumentExpiryState(d) === 'EXPIRING_SOON'
        );
      } else if (filters.expiryFilter === 'EXPIRED') {
        result = result.filter(
          (d) => calculateDocumentExpiryState(d) === 'EXPIRED'
        );
      } else if (filters.expiryFilter === 'NO_EXPIRY') {
        result = result.filter(
          (d) => calculateDocumentExpiryState(d) === 'NO_EXPIRY'
        );
      } else if (filters.expiryFilter === 'NEXT_7_DAYS') {
        result = result.filter((d) => {
          const days = getDaysUntilExpiry(d.expiryDate);
          return days !== null && days >= 0 && days <= 7;
        });
      } else if (filters.expiryFilter === 'NEXT_30_DAYS') {
        result = result.filter((d) => {
          const days = getDaysUntilExpiry(d.expiryDate);
          return days !== null && days >= 0 && days <= 30;
        });
      }
    }

    // 6. Required flag filter
    if (filters.isRequired !== undefined && filters.isRequired !== 'ALL') {
      result = result.filter((d) => d.isRequired === filters.isRequired);
    }

    // 7. Owner user filter
    if (filters.ownerUserId && filters.ownerUserId !== 'ALL') {
      result = result.filter((d) => d.ownerUserId === filters.ownerUserId);
    }

    return structuredClone(result);
  }

  /**
   * Retrieves single document by ID within current study and site scope
   */
  async getDocumentById(
    context: ParticipantQueryContext,
    documentId: string
  ): Promise<Document | null> {
    const doc = this.documents.find(
      (d) =>
        d.id === documentId &&
        d.studyId === context.studyId &&
        d.siteId === context.siteId
    );

    return doc ? structuredClone(doc) : null;
  }

  /**
   * Computes operational summary metrics for the active study and site
   */
  async getDocumentSummary(
    context: ParticipantQueryContext
  ): Promise<DocumentSummaryMetrics> {
    const docs = this.documents.filter(
      (d) => d.studyId === context.studyId && d.siteId === context.siteId
    );

    const total = docs.length;
    const active = docs.filter((d) => d.status === 'ACTIVE').length;
    const expiringSoon = docs.filter(
      (d) => calculateDocumentExpiryState(d) === 'EXPIRING_SOON'
    ).length;
    const expired = docs.filter(
      (d) => calculateDocumentExpiryState(d) === 'EXPIRED'
    ).length;
    const required = docs.filter((d) => d.isRequired).length;
    const actionRequired = docs.filter((d) => isDocumentActionRequired(d)).length;

    return {
      total,
      active,
      expiringSoon,
      expired,
      required,
      actionRequired,
    };
  }

  /**
   * Retrieves all version records for a document in scope
   */
  async getDocumentVersions(
    context: ParticipantQueryContext,
    documentId: string
  ): Promise<DocumentVersion[]> {
    const doc = await this.getDocumentById(context, documentId);
    if (!doc) {
      return [];
    }

    // Sort descending by uploadedAt or version
    const versions = structuredClone(doc.versions);
    versions.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    return versions;
  }

  /**
   * Creates a new document record with optional initial version
   */
  async createDocument(
    context: ParticipantQueryContext,
    input: CreateDocumentInput
  ): Promise<Document> {
    if (!input.title || !input.title.trim()) {
      throw new Error('Document title is required.');
    }
    if (!input.category) {
      throw new Error('Document category is required.');
    }
    if (!input.documentType) {
      throw new Error('Document type is required.');
    }
    if (!input.ownerUserId) {
      throw new Error('Document owner is required.');
    }

    // Validate owner belongs to current study and site and is active
    const owner = this.validateSiteUser(context, input.ownerUserId);

    // Generate unique document ID
    const existingDocNums = this.documents
      .map((d) => {
        const match = d.id.match(/^DOC-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextSeq = existingDocNums.length > 0 ? Math.max(...existingDocNums) + 1 : 101;
    const newDocId = `DOC-${nextSeq}`;

    const nowIso = new Date().toISOString();
    const hasInitialVersion = Boolean(input.fileName || input.initialVersionNumber);
    const versionNumber = input.initialVersionNumber || (hasInitialVersion ? '1.0' : '0.1');

    const versions: DocumentVersion[] = [];
    let currentVersionId = '';

    if (hasInitialVersion) {
      const versionId = `VER-${nextSeq}-1`;
      currentVersionId = versionId;
      versions.push({
        id: versionId,
        documentId: newDocId,
        versionNumber,
        versionLabel: 'Initial Version',
        fileName: input.fileName || `${newDocId}_Initial.pdf`,
        fileType: input.fileType || 'PDF',
        fileSize: input.fileSize || '1.2 MB',
        uploadedBy: input.createdBy || owner.displayName,
        uploadedAt: nowIso,
        effectiveDate: input.effectiveDate,
        expiryDate: input.expiryDate,
        changeSummary: input.changeSummary || 'Initial document creation.',
        status: 'ACTIVE',
        fileBlobUrl: input.fileBlobUrl,
      });
    }

    const initialStatus = hasInitialVersion
      ? deriveDocumentStatus({
          status: 'ACTIVE',
          expiryDate: input.expiryDate,
        })
      : 'DRAFT';

    const newDoc: Document = {
      id: newDocId,
      studyId: context.studyId,
      siteId: context.siteId,
      title: input.title.trim(),
      description: input.description?.trim(),
      category: input.category,
      documentType: input.documentType,
      status: initialStatus,
      isRequired: Boolean(input.isRequired),
      currentVersionId,
      currentVersionNumber: versionNumber,
      effectiveDate: input.effectiveDate,
      expiryDate: input.expiryDate,
      ownerUserId: owner.id,
      ownerName: owner.displayName,
      ownerRoleId: input.ownerRoleId,
      createdBy: input.createdBy || `${owner.displayName}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      versions,
    };

    this.documents.push(newDoc);
    return structuredClone(newDoc);
  }

  /**
   * Adds a new version to an existing document, marking prior active versions SUPERSEDED
   */
  async createDocumentVersion(
    context: ParticipantQueryContext,
    documentId: string,
    input: CreateDocumentVersionInput
  ): Promise<Document> {
    const doc = this.documents.find(
      (d) =>
        d.id === documentId &&
        d.studyId === context.studyId &&
        d.siteId === context.siteId
    );

    if (!doc) {
      throw new Error(`Document "${documentId}" not found in current study/site scope.`);
    }

    if (!input.versionNumber || !input.versionNumber.trim()) {
      throw new Error('Version number is required.');
    }
    if (!input.fileName || !input.fileName.trim()) {
      throw new Error('File name is required.');
    }

    const trimmedVer = input.versionNumber.trim();
    if (doc.versions.some((v) => v.versionNumber === trimmedVer)) {
      throw new Error(`Version "${trimmedVer}" already exists for document ${documentId}.`);
    }

    // Mark previous active version as SUPERSEDED
    doc.versions.forEach((v) => {
      if (v.status === 'ACTIVE') {
        v.status = 'SUPERSEDED';
      }
    });

    const nowIso = new Date().toISOString();
    const versionSeq = doc.versions.length + 1;
    const docNum = doc.id.replace('DOC-', '');
    const newVersionId = `VER-${docNum}-${versionSeq}`;

    const newVersion: DocumentVersion = {
      id: newVersionId,
      documentId: doc.id,
      versionNumber: trimmedVer,
      versionLabel: input.versionLabel,
      fileName: input.fileName.trim(),
      fileType: input.fileType || 'PDF',
      fileSize: input.fileSize || '1.5 MB',
      uploadedBy: input.uploadedBy,
      uploadedAt: nowIso,
      effectiveDate: input.effectiveDate || doc.effectiveDate,
      expiryDate: input.expiryDate || doc.expiryDate,
      changeSummary: input.changeSummary || 'New version uploaded.',
      status: 'ACTIVE',
      fileBlobUrl: input.fileBlobUrl,
    };

    doc.versions.push(newVersion);
    doc.currentVersionId = newVersion.id;
    doc.currentVersionNumber = newVersion.versionNumber;

    if (input.effectiveDate) {
      doc.effectiveDate = input.effectiveDate;
    }
    if (input.expiryDate) {
      doc.expiryDate = input.expiryDate;
    }

    doc.updatedAt = nowIso;
    doc.status = deriveDocumentStatus(doc);

    return structuredClone(doc);
  }

  /**
   * Updates document metadata
   */
  async updateDocument(
    context: ParticipantQueryContext,
    documentId: string,
    update: UpdateDocumentInput
  ): Promise<Document> {
    const doc = this.documents.find(
      (d) =>
        d.id === documentId &&
        d.studyId === context.studyId &&
        d.siteId === context.siteId
    );

    if (!doc) {
      throw new Error(`Document "${documentId}" not found in current study/site scope.`);
    }

    if (update.ownerUserId && update.ownerUserId !== doc.ownerUserId) {
      const newOwner = this.validateSiteUser(context, update.ownerUserId);
      doc.ownerUserId = newOwner.id;
      doc.ownerName = newOwner.displayName;
    }

    if (update.title !== undefined) doc.title = update.title.trim();
    if (update.description !== undefined) doc.description = update.description.trim();
    if (update.category !== undefined) doc.category = update.category;
    if (update.documentType !== undefined) doc.documentType = update.documentType;
    if (update.isRequired !== undefined) doc.isRequired = update.isRequired;
    if (update.effectiveDate !== undefined) doc.effectiveDate = update.effectiveDate;
    if (update.relatedEntityType !== undefined) doc.relatedEntityType = update.relatedEntityType;
    if (update.relatedEntityId !== undefined) doc.relatedEntityId = update.relatedEntityId;

    if (update.expiryDate !== undefined) {
      doc.expiryDate = update.expiryDate;
      // Also update the current active version's expiry date if present
      const currentVer = doc.versions.find((v) => v.id === doc.currentVersionId);
      if (currentVer) {
        currentVer.expiryDate = update.expiryDate;
      }
      doc.status = deriveDocumentStatus(doc);
    }

    if (update.status !== undefined) {
      doc.status = update.status;
    }

    doc.updatedAt = new Date().toISOString();
    return structuredClone(doc);
  }

  /**
   * Archives a document and marks all its version records ARCHIVED
   */
  async archiveDocument(
    context: ParticipantQueryContext,
    documentId: string
  ): Promise<Document> {
    const doc = this.documents.find(
      (d) =>
        d.id === documentId &&
        d.studyId === context.studyId &&
        d.siteId === context.siteId
    );

    if (!doc) {
      throw new Error(`Document "${documentId}" not found in current study/site scope.`);
    }

    doc.status = 'ARCHIVED';
    doc.versions.forEach((v) => {
      v.status = 'ARCHIVED';
    });
    doc.updatedAt = new Date().toISOString();

    return structuredClone(doc);
  }

  /**
   * Helper returning current expiry state
   */
  getExpiryState(
    document: Document,
    referenceDate: string = DOCUMENT_REFERENCE_DATE
  ): DocumentExpiryState {
    return calculateDocumentExpiryState(document, referenceDate);
  }
}

export const mockDocumentRepository = new MockDocumentRepository();
