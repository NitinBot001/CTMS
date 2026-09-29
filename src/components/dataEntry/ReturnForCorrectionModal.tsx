import React, { useState } from 'react';
import { VisitDataField } from '../../types';
import { AlertTriangle, AlertCircle, CheckSquare, Square } from 'lucide-react';

interface ReturnForCorrectionModalProps {
  isOpen: boolean;
  fields: VisitDataField[];
  onClose: () => void;
  onConfirm: (reason: string, affectedFields: string[]) => Promise<void>;
}

export const ReturnForCorrectionModal: React.FC<ReturnForCorrectionModalProps> = ({
  isOpen,
  fields,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleField = (fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey) ? prev.filter((k) => k !== fieldKey) : [...prev, fieldKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedFields.length === fields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(fields.map((f) => f.fieldKey));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Mandatory requirement: You must provide an explicit clinical return reason.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onConfirm(reason.trim(), selectedFields);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to return record for correction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-stone-300 rounded-sm shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
        <div className="flex items-start space-x-3 pb-3 border-b border-stone-200">
          <div className="w-10 h-10 rounded-sm bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-800 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">Return Record for Correction</h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Identify discrepancies between source documentation and entered visit values. This will unlock the record for the Data Entry Operator.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Mandatory Return Reason */}
          <div>
            <label htmlFor="return-reason" className="block text-stone-800 font-semibold mb-1">
              Correction Reason <span className="text-rose-600">* (Mandatory)</span>
            </label>
            <textarea
              id="return-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="e.g. Blood pressure value in CTMS (142/90) contradicts attached source CRF worksheet (124/82). Please recheck and amend."
              className="w-full border border-stone-300 rounded-sm p-2.5 text-stone-800 focus:outline-none focus:border-rose-600"
            />
          </div>

          {/* Select Affected Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-stone-800 font-semibold">
                Select Discrepant / Affected Fields ({selectedFields.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-[#7A2A12] hover:underline font-medium"
              >
                {selectedFields.length === fields.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-sm divide-y divide-stone-100 bg-stone-50/50 p-1">
              {fields.map((field) => {
                const isSelected = selectedFields.includes(field.fieldKey);
                return (
                  <div
                    key={field.id}
                    onClick={() => toggleField(field.fieldKey)}
                    className="flex items-center justify-between p-2 hover:bg-stone-100/80 rounded-xs cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-2">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-rose-700 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-medium text-stone-900">{field.label}</span>
                        <span className="text-[10px] text-stone-500 font-mono ml-2">
                          ({field.fieldKey})
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-stone-700 bg-white px-2 py-0.5 border border-stone-200 rounded-xs">
                      {field.value || '—'} {field.unit || ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Selected fields will be visually highlighted with an alert banner on the Operator's editing screen.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 border border-stone-300 text-stone-700 rounded-sm hover:bg-stone-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-sm shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Return for Correction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
