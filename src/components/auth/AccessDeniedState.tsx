import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedStateProps {
  requiredPermission?: string;
  customMessage?: string;
}

export const AccessDeniedState: React.FC<AccessDeniedStateProps> = ({
  requiredPermission,
  customMessage,
}) => {
  const navigate = useNavigate();
  const { currentUser, currentRole, roleLandingRoute } = useAuth();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-sm border border-stone-200 shadow-sm p-8 text-center">
        {/* Institutional Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title */}
        <h2 className="font-serif text-xl font-bold text-stone-900 mb-2">
          Access Restricted
        </h2>

        {/* Description */}
        <p className="text-sm text-stone-600 mb-6 leading-relaxed">
          {customMessage ||
            'Your assigned role does not hold the clinical delegations or system permissions required to access this operational view.'}
        </p>

        {/* Context Details Card */}
        <div className="bg-stone-50 border border-stone-200 rounded-sm p-4 mb-6 text-left text-xs space-y-2">
          <div className="flex justify-between items-center py-1 border-b border-stone-200">
            <span className="text-stone-500 font-medium">Active User:</span>
            <span className="font-semibold text-stone-800">{currentUser?.name || 'Unknown'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-stone-200">
            <span className="text-stone-500 font-medium">Assigned Role:</span>
            <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {currentRole?.name || 'Unassigned'}
            </span>
          </div>
          {requiredPermission && (
            <div className="flex justify-between items-center py-1">
              <span className="text-stone-500 font-medium">Required Permission:</span>
              <code className="font-mono text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                {requiredPermission}
              </code>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-4 py-2 border border-stone-300 shadow-sm text-xs font-medium rounded-sm text-stone-700 bg-white hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Previous Page
          </button>
          <button
            type="button"
            onClick={() => navigate(roleLandingRoute || '/')}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-xs font-medium rounded-sm text-white bg-[#7A2A12] hover:bg-[#63220E] transition-colors"
          >
            <Home className="w-3.5 h-3.5 mr-1.5" />
            Return to Dashboard
          </button>
        </div>

        {/* Disclaimer / Support */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-center text-xs text-stone-500">
          <HelpCircle className="w-3.5 h-3.5 mr-1 text-stone-400" />
          <span>If delegation updates are required, contact the Principal Investigator.</span>
        </div>
      </div>
    </div>
  );
};
