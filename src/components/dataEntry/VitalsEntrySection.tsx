import React from 'react';
import { VisitDataField } from '../../types';
import { validateVitalField } from '../../utils/visitDataCalculations';
import { Activity, AlertTriangle, AlertCircle } from 'lucide-react';

interface VitalsEntrySectionProps {
  fields: VisitDataField[];
  readOnly?: boolean;
  onFieldChange?: (fieldKey: string, value: string) => void;
}

interface VitalConfig {
  fieldKey: string;
  label: string;
  unit: string;
  placeholder: string;
  sourceReference: string;
}

const VITALS_CONFIG: VitalConfig[] = [
  {
    fieldKey: 'temperature',
    label: 'Body Temperature',
    unit: '°F',
    placeholder: '98.6',
    sourceReference: 'CRF Vitals Section Row 1',
  },
  {
    fieldKey: 'pulse',
    label: 'Pulse Rate',
    unit: 'bpm',
    placeholder: '72',
    sourceReference: 'CRF Vitals Section Row 2',
  },
  {
    fieldKey: 'bloodPressure',
    label: 'Blood Pressure',
    unit: 'mmHg',
    placeholder: '120/80',
    sourceReference: 'CRF Vitals Section Row 3',
  },
  {
    fieldKey: 'respiratoryRate',
    label: 'Respiratory Rate',
    unit: 'breaths/min',
    placeholder: '16',
    sourceReference: 'CRF Vitals Section Row 4',
  },
  {
    fieldKey: 'weight',
    label: 'Weight',
    unit: 'kg',
    placeholder: '68.5',
    sourceReference: 'Anthropometry Log',
  },
  {
    fieldKey: 'height',
    label: 'Height',
    unit: 'cm',
    placeholder: '172',
    sourceReference: 'Anthropometry Log',
  },
];

export const VitalsEntrySection: React.FC<VitalsEntrySectionProps> = ({
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
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Patient Vitals & Anthropometric Data</h3>
          <p className="text-xs text-stone-500">
            Source-verified physiological observations recorded during the clinical visit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {VITALS_CONFIG.map((config) => {
          const field = getField(config.fieldKey);
          const value = field?.value || '';
          const isFlagged = Boolean(field?.flaggedForCorrection);
          const flagReason = field?.flagReason;

          // Validation warning
          const validation = value ? validateVitalField(config.fieldKey, value) : null;
          const showWarning = validation && (!validation.isValid || validation.isAbnormal) && validation.message;

          return (
            <div
              key={config.fieldKey}
              className={`p-3.5 rounded-sm border transition-all ${
                isFlagged
                  ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                  : 'bg-stone-50/40 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`vital-${config.fieldKey}`}
                  className={`text-xs font-semibold ${isFlagged ? 'text-rose-900' : 'text-stone-800'}`}
                >
                  {config.label}
                </label>
                <span className="text-[10px] font-mono text-stone-500 bg-white px-1.5 py-0.5 border border-stone-200 rounded-xs">
                  {config.unit}
                </span>
              </div>

              {/* Input field */}
              <div className="relative mt-1">
                <input
                  id={`vital-${config.fieldKey}`}
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
              </div>

              {/* Source reference */}
              <div className="mt-1.5 text-[10px] text-stone-500 flex items-center justify-between">
                <span>Ref: {config.sourceReference}</span>
              </div>

              {/* Flagged Alert Banner */}
              {isFlagged && (
                <div className="mt-2 text-[11px] bg-rose-100/80 border border-rose-300 text-rose-800 p-2 rounded-xs flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-700" />
                  <div>
                    <strong className="block font-semibold">Flagged for Correction:</strong>
                    <span>{flagReason || 'Discrepancy identified during Sub-I review.'}</span>
                  </div>
                </div>
              )}

              {/* Clinical Range Warning */}
              {!isFlagged && showWarning && (
                <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>{validation.message}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
