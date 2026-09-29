import React, { useState } from 'react';
import { ReviewNote, ReviewNoteType, Permission } from '../../types';
import { visitDataService } from '../../services/visitDataService';
import { MessageSquare, Plus, Send, AlertCircle, Sparkles } from 'lucide-react';

interface ReviewNotesPanelProps {
  recordId: string;
  notes: ReviewNote[];
  userPermissions: Permission[];
  onAddNote: (note: { type: ReviewNoteType; message: string }) => Promise<void>;
  disabled?: boolean;
}

export const ReviewNotesPanel: React.FC<ReviewNotesPanelProps> = ({
  notes,
  userPermissions,
  onAddNote,
  disabled = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteType, setNoteType] = useState<ReviewNoteType>('COMMENT');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canAddNote = visitDataService.canAddReviewNote(userPermissions) && !disabled;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('Please enter note contents.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onAddNote({
        type: noteType,
        message: message.trim(),
      });
      setMessage('');
      setShowAddForm(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit review note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNoteTypeBadge = (type: ReviewNoteType) => {
    switch (type) {
      case 'CLINICAL_REVIEW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Clinical Review
          </span>
        );
      case 'SUGGESTION':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Suggestion
          </span>
        );
      case 'COMMENT':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            Comment
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-sm bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Review Notes & Advisory Feedback</h3>
            <p className="text-xs text-stone-500">
              Multi-role observations from Sub-Investigator, Pharmacist, Nurse, and Clinical Monitors.
            </p>
          </div>
        </div>

        {canAddNote && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-[#7A2A12] bg-[#7A2A12]/5 hover:bg-[#7A2A12]/10 border border-[#7A2A12]/20 rounded-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        )}
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B8862E]" />
              New Advisory Review Note
            </span>
            <div className="flex items-center space-x-2">
              <label htmlFor="note-type" className="text-xs text-stone-600 font-medium">Type:</label>
              <select
                id="note-type"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as ReviewNoteType)}
                className="text-xs border border-stone-300 rounded-sm bg-white px-2.5 py-1 text-stone-800 focus:outline-none focus:border-[#7A2A12]"
              >
                <option value="COMMENT">General Comment</option>
                <option value="SUGGESTION">Correction Suggestion</option>
                <option value="CLINICAL_REVIEW">Clinical Review Finding</option>
              </select>
            </div>
          </div>

          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type clinical review comment or guidance for data entry operator..."
            className="w-full text-xs border border-stone-300 rounded-sm p-2.5 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#7A2A12]"
          />

          {errorMessage && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-700 bg-rose-50 p-2 rounded-sm border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setMessage('');
                setErrorMessage(null);
              }}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-200 bg-white rounded-sm hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#7A2A12] hover:bg-[#5A1E0D] rounded-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Post Note'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="mt-4 space-y-3">
        {notes.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500 bg-stone-50/60 border border-dashed border-stone-200 rounded-sm">
            No advisory review notes recorded on this visit record yet.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3.5 bg-stone-50/70 border border-stone-200 rounded-sm space-y-2 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-stone-900">{note.authorName}</span>
                  <span className="inline-block px-1.5 py-0.5 rounded-xs text-[10px] font-medium bg-stone-200/80 text-stone-700">
                    {note.authorRoleName}
                  </span>
                  {getNoteTypeBadge(note.type)}
                </div>
                <span className="text-[11px] text-stone-500 font-mono">
                  {new Date(note.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <p className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
                {note.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
