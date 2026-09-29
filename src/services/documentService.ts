import { IDocumentRepository, ParticipantQueryContext } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import {
  Document,
  DocumentVersion,
  DocumentSummaryMetrics,
  DocumentFilters,
  CreateDocumentInput,
  CreateDocumentVersionInput,
  UpdateDocumentInput,
  DocumentExpiryState,
} from '../types';

export class DocumentService {
  private _customRepo?: IDocumentRepository;

  constructor(repository?: IDocumentRepository) {
    this._customRepo = repository;
  }

  private get repo(): IDocumentRepository {
    return this._customRepo || environmentService.getDocumentRepository();
  }

  /**
   * Retrieves all documents for active study and site context with optional filtering
   */
  async getDocuments(
    context: ParticipantQueryContext,
    filters?: DocumentFilters
  ): Promise<Document[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getDocuments(context, filters);
  }

  /**
   * Retrieves single document by ID within active context
   */
  async getDocumentById(
    context: ParticipantQueryContext,
    documentId: string
  ): Promise<Document | null> {
    if (!context.studyId || !context.siteId || !documentId) {
      return null;
    }
    return this.repo.getDocumentById(context, documentId);
  }

  /**
   * Computes operational summary metrics for documents in active context
   */
  async getDocumentSummary(
    context: ParticipantQueryContext
  ): Promise<DocumentSummaryMetrics> {
    if (!context.studyId || !context.siteId) {
      return {
        total: 0,
        active: 0,
        expiringSoon: 0,
        expired: 0,
        required: 0,
        actionRequired: 0,
      };
    }
    return this.repo.getDocumentSummary(context);
  }

  /**
   * Retrieves version history records for a document
   */
  async getDocumentVersions(
    context: ParticipantQueryContext,
    documentId: string
  ): Promise<DocumentVersion[]> {
    if (!context.studyId || !context.siteId || !documentId) {
      return [];
    }
    return this.repo.getDocumentVersions(context, documentId);
  }

  /**
   * Creates a new controlled document record
   */
  async createDocument(
    context: ParticipantQueryContext,
    input: CreateDocumentInput
  ): Promise<Document> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are required to create a document.');
    }
    return this.repo.createDocument(context, input);
  }

  /**
   * Adds a new version to an existing document and supersedes previous active version
   */
  async createDocumentVersion(
    context: ParticipantQueryContext,
    documentId: string,
    input: CreateDocumentVersionInput
  ): Promise<Document> {
    if (!context.studyId || !context.siteId || !documentId) {
      throw new Error('Valid context and document ID are required to add a version.');
    }
    return this.repo.createDocumentVersion(context, documentId, input);
  }

  /**
   * Updates metadata of an existing document
   */
  async updateDocument(
    context: ParticipantQueryContext,
    documentId: string,
    update: UpdateDocumentInput
  ): Promise<Document> {
    if (!context.studyId || !context.siteId || !documentId) {
      throw new Error('Valid context and document ID are required to update a document.');
    }
    return this.repo.updateDocument(context, documentId, update);
  }

  /**
   * Archives a document
   */
  async archiveDocument(
    context: ParticipantQueryContext,
    documentId: string
  ): Promise<Document> {
    if (!context.studyId || !context.siteId || !documentId) {
      throw new Error('Valid context and document ID are required to archive a document.');
    }
    return this.repo.archiveDocument(context, documentId);
  }

  /**
   * Helper to derive expiry state
   */
  getExpiryState(
    document: Document,
    referenceDate?: string
  ): DocumentExpiryState {
    return this.repo.getExpiryState(document, referenceDate);
  }
}

export const documentService = new DocumentService();
