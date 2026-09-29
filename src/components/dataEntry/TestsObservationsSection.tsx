import React from 'react';
import { VisitDataField } from '../../types';
import { FlaskConical, AlertCircle } from 'lucide-react';

interface TestsObservationsSectionProps {
  fields: VisitDataField[];
  readOnly?: boolean;
  onFieldChange?: (fieldKey: string, value: string) => void;
}

interface TestConfig {
  fieldKey: string;
  label: string;
  unit?: string;
  placeholder: string;
  sourceReference: string;
  isTextArea?: boolean;
}

const TESTS_CONFIG: TestConfig[] = [
  {
    fieldKey: 'hemoglobin',
    label: 'Hemoglobin (Hb)',
    unit: 'g/dL',
    placeholder: '13.8',
    sourceReference: 'CBC Report Page 1',
  },
  {
    fieldKey: 'wbc',
    label: 'Total Leukocyte Count (WBC)',
    unit: 'cells/mcL',
    placeholder: '6800',
    sourceReference: 'CBC Report Page 1',
  },
  {
    fieldKey: 'platelets',
    label: 'Platelet Count',
    unit: 'cells/mcL',
    placeholder: '220000',
    sourceReference: 'CBC Report Page 2',
  },
  {
    fieldKey: 'creatinine',
    label: 'Serum Creatinine',
    unit: 'mg/dL',
    placeholder: '0.9',
    sourceReference: 'Biochemistry Panel',
  },
  {
    fieldKey: 'clinicalNotes',
    label: 'Clinical Examination & Findings',
    placeholder: 'Enter physician physical examination observations, systemic review...',
    sourceReference: 'Physician Progress Notes',
    isTextArea: true,
  },
  {
    fieldKey: 'adverseObservations',
    label: 'Adverse Symptoms & Patient Complaints',
    placeholder: 'Note any patient-reported symptoms, mild discomfort, or adverse events...',
    sourceReference: 'Subject Interview Form',
    isTextArea: true,
  },
];

export const TestsObservationsSection: React.FC<TestsObservationsSectionProps> = ({
  fields,
  readOnly = false,
  onFieldChange,
}) => {
  const getField = (key: string): VisitDataField | undefined => {
    return fields.find((f) => f.fieldKey === key);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5 space-y-4">
      <div className="flex items-center space-x-2.5 pb-3 border-b border-stone-200">
        <div className="w-8 h-8 rounded-sm bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
          <FlaskConical className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Laboratory Tests & Clinical Observations</h3>
          <p className="text-xs text-stone-500">
            Biochemical parameters and physician progress notes recorded for protocol compliance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TESTS_CONFIG.map((config) => {
          const field = getField(config.fieldKey);
          const value = field?.value || '';
          const isFlagged = Boolean(field?.flaggedForCorrection);
          const flagReason = field?.flagReason;

          return (
            <div
              key={config.fieldKey}
              className={`p-3.5 rounded-sm border transition-all ${
                config.isTextArea ? 'md:col-span-2' : ''
              } ${
                isFlagged
                  ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                  : 'bg-stone-50/40 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`test-${config.fieldKey}`}
                  className={`text-xs font-semibold ${isFlagged ? 'text-rose-900' : 'text-stone-800'}`}
                >
                  {config.label}
                </label>
                {config.unit && (
                  <span className="text-[10px] font-mono text-stone-500 bg-white px-1.5 py-0.5 border border-stone-200 rounded-xs">
                    {config.unit}
                  </span>
                )}
              </div>

              {/* Input or Textarea */}
              {config.isTextArea ? (
                <textarea
                  id={`test-${config.fieldKey}`}
                  rows={2}
                  readOnly={readOnly}
                  value={value}
                  onChange={(e) => onFieldChange && onFieldChange(config.fieldKey, e.target.value)}
                  placeholder={config.placeholder}
                  className={`w-full text-xs p-2.5 rounded-sm border transition-colors ${
                    readOnly
                      ? 'bg-stone-100 text-stone-800 cursor-not-allowed border-stone-200'
                      : isFlagged
                      ? 'bg-white text-rose-950 border-rose-300 focus:outline-none focus:border-rose-600'
                      : 'bg-white text-stone-900 border-stone-300 focus:outline-none focus:border-[#7A2A12]'
                  }`}
                />
              ) : (
                <input
                  id={`test-${config.fieldKey}`}
                  type="text"
                  readOnly={readOnly}
                  value={value}
                  onChange={(e) => onFieldChange && onFieldChange(config.fieldKey, e.target.value)}
                  placeholder={config.placeholder}
                  className={`w-full text-xs font-mono px-3 py-2 rounded-sm border transition-colors ${
                    readOnly
                      ? 'bg-stone-100 text-stone-800 cursor-not-allowed border-stone-200'
                      : isFlagged
                      ? 'bg-white text-rose-950 border-rose-300 focus:outline-none focus:border-rose-600'
                      : 'bg-white text-stone-900 border-stone-300 focus:outline-none focus:border-[#7A2A12]'
                  }`}
                />
              )}

              <div className="mt-1.5 text-[10px] text-stone-500 flex items-center justify-between">
                <span>Source: {config.sourceReference}</span>
              </div>

              {isFlagged && (
                <div className="mt-2 text-[11px] bg-rose-100/80 border border-rose-300 text-rose-800 p-2 rounded-xs flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-700" />
                  <div>
                    <strong className="block font-semibold">Flagged for Correction:</strong>
                    <span>{flagReason || 'Discrepancy identified during Sub-I review.'}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
