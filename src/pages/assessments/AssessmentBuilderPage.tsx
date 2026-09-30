import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assessmentService } from '../../services/assessmentService';
import {
  AssessmentInstrument,
  AssessmentInstrumentVersion,
  AssessmentSection,
  AssessmentItem,
  AssessmentRule,
  AssessmentItemType,
  AssessmentRuleOperator,
  AssessmentRuleAction,
  AssessmentValidationResult,
  AssessmentOption,
} from '../../types';
import {
  ChevronLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  Save,
  Lock,
  Sparkles,
  GitBranch,
  Layers,
} from 'lucide-react';

export const AssessmentBuilderPage: React.FC = () => {
  const { instrumentId } = useParams<{ instrumentId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [instrument, setInstrument] = useState<AssessmentInstrument | null>(null);
  const [, setVersions] = useState<AssessmentInstrumentVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<AssessmentInstrumentVersion | null>(null);

  const [sections, setSections] = useState<AssessmentSection[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [rules, setRules] = useState<AssessmentRule[]>([]);

  // Selection
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Form State for Active Item
  const [itemForm, setItemForm] = useState<{
    itemCode: string;
    itemType: AssessmentItemType;
    questionText: string;
    helpText: string;
    required: boolean;
    options: AssessmentOption[];
    scaleMin: number;
    scaleMax: number;
    minLabel: string;
    maxLabel: string;
  }>({
    itemCode: '',
    itemType: 'SINGLE_CHOICE',
    questionText: '',
    helpText: '',
    required: true,
    options: [],
    scaleMin: 1,
    scaleMax: 5,
    minLabel: 'Low',
    maxLabel: 'High',
  });

  // Form State for Active Section
  const [sectionForm, setSectionForm] = useState<{
    sectionCode: string;
    title: string;
    description: string;
  }>({
    sectionCode: '',
    title: '',
    description: '',
  });

  // Validation Result
  const [validationResult, setValidationResult] = useState<AssessmentValidationResult | null>(null);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Rule Form Modal State
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRule, setNewRule] = useState<{
    sourceItemId: string;
    operator: AssessmentRuleOperator;
    expectedValue: string;
    action: AssessmentRuleAction;
    targetItemId: string;
    targetSectionId: string;
  }>({
    sourceItemId: '',
    operator: 'EQUALS',
    expectedValue: '',
    action: 'SHOW_ITEM',
    targetItemId: '',
    targetSectionId: '',
  });

  const loadData = useCallback(async () => {
    if (!instrumentId) return;
    setIsLoading(true);
    try {
      const inst = await assessmentService.getInstrumentById(instrumentId);
      setInstrument(inst);

      if (inst) {
        const vList = await assessmentService.getVersions(instrumentId);
        setVersions(vList);

        // Pick active draft or active version
        const draftVer = vList.find((v) => v.status === 'DRAFT');
        const chosenVer = draftVer || vList.find((v) => v.status === 'ACTIVE') || vList[0] || null;
        setActiveVersion(chosenVer);

        if (chosenVer) {
          const [secList, itList, ruleList] = await Promise.all([
            assessmentService.getSections(chosenVer.versionId),
            assessmentService.getItems(chosenVer.versionId),
            assessmentService.getRules(chosenVer.versionId),
          ]);
          setSections(secList);
          setItems(itList);
          setRules(ruleList);

          if (secList.length > 0) {
            setSelectedSectionId(secList[0].sectionId);
            setSectionForm({
              sectionCode: secList[0].sectionCode,
              title: secList[0].title,
              description: secList[0].description || '',
            });
          }

          if (itList.length > 0) {
            setSelectedItemId(itList[0].itemId);
            loadItemToForm(itList[0]);
          }

          // Initial validation
          const valRes = await assessmentService.validateVersion(chosenVer.versionId);
          setValidationResult(valRes);
        }
      }
    } catch (err: any) {
      console.error('Failed to load instrument builder data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [instrumentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadItemToForm = (item: AssessmentItem) => {
    setSelectedItemId(item.itemId);
    setSelectedSectionId(item.sectionId);
    setItemForm({
      itemCode: item.itemCode,
      itemType: item.itemType,
      questionText: item.questionText,
      helpText: item.helpText || '',
      required: item.required,
      options: item.responseDefinition?.options ? [...item.responseDefinition.options] : [],
      scaleMin: item.responseDefinition?.minVal ?? 1,
      scaleMax: item.responseDefinition?.maxVal ?? 5,
      minLabel: item.responseDefinition?.scaleMinLabel ?? 'Low',
      maxLabel: item.responseDefinition?.scaleMaxLabel ?? 'High',
    });
  };

  const isDraft = activeVersion?.status === 'DRAFT';
  const isRestricted = instrument?.rightsStatus === 'RESTRICTED' || instrument?.contentStatus === 'METADATA_ONLY';

  // Section Handlers
  const handleAddSection = async () => {
    if (!activeVersion || !isDraft) return;
    try {
      const nextOrder = sections.length + 1;
      const newSec = await assessmentService.createSection(
        {
          instrumentVersionId: activeVersion.versionId,
          sectionCode: `SEC_${nextOrder.toString().padStart(2, '0')}`,
          title: `New Section ${nextOrder}`,
          order: nextOrder,
        },
        {
          userId: currentUser?.id || 'USR-PI',
          role: currentUser?.designation || 'ROLE_PI',
        }
      );
      setSections([...sections, newSec]);
      setSelectedSectionId(newSec.sectionId);
      setSectionForm({
        sectionCode: newSec.sectionCode,
        title: newSec.title,
        description: '',
      });
      refreshValidation();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveSection = async () => {
    if (!selectedSectionId || !isDraft) return;
    setIsSaving(true);
    try {
      const updated = await assessmentService.updateSection(
        selectedSectionId,
        {
          sectionCode: sectionForm.sectionCode,
          title: sectionForm.title,
          description: sectionForm.description,
        },
        {
          userId: currentUser?.id || 'USR-PI',
          role: currentUser?.designation || 'ROLE_PI',
        }
      );
      if (updated) {
        setSections(sections.map((s) => (s.sectionId === selectedSectionId ? updated : s)));
        setStatusMessage({ type: 'success', text: 'Section saved successfully.' });
      }
      refreshValidation();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveSection = async (secIndex: number, direction: 'UP' | 'DOWN') => {
    if (!activeVersion || !isDraft) return;
    const targetIndex = direction === 'UP' ? secIndex - 1 : secIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(secIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderedIds = reordered.map((s) => s.sectionId);
    try {
      const result = await assessmentService.reorderSections(activeVersion.versionId, orderedIds);
      setSections(result);
      refreshValidation();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Item Handlers
  const handleAddItem = async () => {
    if (!activeVersion || !isDraft || !selectedSectionId) return;
    try {
      const secItems = items.filter((it) => it.sectionId === selectedSectionId);
      const nextOrder = secItems.length + 1;
      const newItem = await assessmentService.createItem(
        {
          instrumentVersionId: activeVersion.versionId,
          sectionId: selectedSectionId,
          itemCode: `ITEM_${Date.now().toString(36).toUpperCase()}`,
          itemType: 'SINGLE_CHOICE',
          questionText: 'Untitled Question',
          order: nextOrder,
          required: true,
          responseDefinition: {
            id: `RESP_DEF_${Date.now().toString(36).toUpperCase()}`,
            itemType: 'SINGLE_CHOICE',
            options: [
              { optionId: 'OPT_1', value: '1', label: 'Option 1', order: 1 },
              { optionId: 'OPT_2', value: '2', label: 'Option 2', order: 2 },
            ],
          },
        },
        {
          userId: currentUser?.id || 'USR-PI',
          role: currentUser?.designation || 'ROLE_PI',
        }
      );

      setItems([...items, newItem]);
      loadItemToForm(newItem);
      refreshValidation();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveItem = async () => {
    if (!selectedItemId || !isDraft) return;
    setIsSaving(true);
    try {
      const respDef =
        itemForm.itemType === 'SINGLE_CHOICE' || itemForm.itemType === 'MULTI_CHOICE'
          ? {
              id: `RESP_${selectedItemId}`,
              itemType: itemForm.itemType,
              options: itemForm.options,
            }
          : itemForm.itemType === 'SCALE'
          ? {
              id: `RESP_${selectedItemId}`,
              itemType: itemForm.itemType,
              minVal: itemForm.scaleMin,
              maxVal: itemForm.scaleMax,
              scaleMinLabel: itemForm.minLabel,
              scaleMaxLabel: itemForm.maxLabel,
            }
          : undefined;

      const updated = await assessmentService.updateItem(
        selectedItemId,
        {
          itemCode: itemForm.itemCode,
          itemType: itemForm.itemType,
          questionText: itemForm.questionText,
          helpText: itemForm.helpText,
          required: itemForm.required,
          responseDefinition: respDef,
        },
        {
          userId: currentUser?.id || 'USR-PI',
          role: currentUser?.designation || 'ROLE_PI',
        }
      );

      if (updated) {
        setItems(items.map((it) => (it.itemId === selectedItemId ? updated : it)));
        setStatusMessage({ type: 'success', text: 'Item saved successfully.' });
      }
      refreshValidation();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveItem = async (itemIndex: number, direction: 'UP' | 'DOWN') => {
    if (!activeVersion || !isDraft || !selectedSectionId) return;
    const secItems = items.filter((it) => it.sectionId === selectedSectionId);
    const targetIndex = direction === 'UP' ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= secItems.length) return;

    const reordered = [...secItems];
    const [moved] = reordered.splice(itemIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderedIds = reordered.map((it) => it.itemId);
    try {
      await assessmentService.reorderItems(activeVersion.versionId, selectedSectionId, orderedIds);
      // update items
      const otherItems = items.filter((it) => it.sectionId !== selectedSectionId);
      setItems([...otherItems, ...reordered]);
      refreshValidation();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!isDraft) return;
    try {
      await assessmentService.deleteItem(itemId, {
        userId: currentUser?.id || 'USR-PI',
        role: currentUser?.designation || 'ROLE_PI',
      });
      const remaining = items.filter((it) => it.itemId !== itemId);
      setItems(remaining);
      if (selectedItemId === itemId) {
        if (remaining.length > 0) {
          loadItemToForm(remaining[0]);
        } else {
          setSelectedItemId(null);
        }
      }
      refreshValidation();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // Branching Rules Handlers
  const handleAddRule = async () => {
    if (!activeVersion || !isDraft) return;
    try {
      const created = await assessmentService.createRule(
        {
          instrumentVersionId: activeVersion.versionId,
          sourceItemId: newRule.sourceItemId,
          operator: newRule.operator,
          expectedValue: newRule.expectedValue,
          action: newRule.action,
          targetItemId: newRule.targetItemId || undefined,
          targetSectionId: newRule.targetSectionId || undefined,
        },
        {
          userId: currentUser?.id || 'USR-PI',
          role: currentUser?.designation || 'ROLE_PI',
        }
      );
      setRules([...rules, created]);
      setShowAddRuleModal(false);
      refreshValidation();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!isDraft) return;
    try {
      await assessmentService.deleteRule(ruleId, {
        userId: currentUser?.id || 'USR-PI',
        role: currentUser?.designation || 'ROLE_PI',
      });
      setRules(rules.filter((r) => r.ruleId !== ruleId));
      refreshValidation();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const refreshValidation = async () => {
    if (!activeVersion) return;
    try {
      const val = await assessmentService.validateVersion(activeVersion.versionId);
      setValidationResult(val);
    } catch (err: any) {
      console.error('Validation engine error:', err);
    }
  };

  // Publish Version
  const handlePublish = async () => {
    if (!activeVersion || !isDraft) return;
    setIsSaving(true);
    try {
      const result = await assessmentService.publishVersion(activeVersion.versionId, {
        userId: currentUser?.id || 'USR-PI',
        role: currentUser?.designation || 'ROLE_PI',
      });
      setActiveVersion(result.version);
      setStatusMessage({ type: 'success', text: `Version v${result.version.versionLabel} published and activated successfully!` });
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-neutral-500">
        Loading assessment builder workspace...
      </div>
    );
  }

  if (!instrument) {
    return (
      <div className="p-8 text-center text-xs text-neutral-600">
        Assessment instrument not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Control Header */}
      <div className="bg-white p-4 rounded-sm border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pi/assessments')}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-sm hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-neutral-900">
                {instrument.name}
              </span>
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-300">
                {instrument.category}
              </span>
              {instrument.rightsStatus === 'VERIFIED' ? (
                <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Synthetic Demo
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Restricted Metadata
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-3">
              <span>
                Version: <strong className="text-neutral-800">v{activeVersion?.versionLabel || '1.0'}</strong>
              </span>
              <span>
                Status:{' '}
                <strong
                  className={
                    activeVersion?.status === 'ACTIVE'
                      ? 'text-emerald-700'
                      : activeVersion?.status === 'DRAFT'
                      ? 'text-amber-700'
                      : 'text-neutral-700'
                  }
                >
                  {activeVersion?.status}
                </strong>
              </span>
              <span>Sections: {sections.length}</span>
              <span>Items: {items.length}</span>
              <span>Rules: {rules.length}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isDraft ? (
            <button
              onClick={handlePublish}
              disabled={isSaving || (validationResult !== null && !validationResult.isValid)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm shadow-xs transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Publish & Activate Version</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 border border-neutral-300 rounded-sm">
              <Lock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Published & Immutable</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Feedback Notification */}
      {statusMessage && (
        <div
          className={`p-3 rounded-sm text-xs flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-neutral-500 hover:text-neutral-800 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Restricted Source Notice */}
      {isRestricted && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Standardized Instrument Reproduction Restriction</div>
            <div className="mt-0.5 text-neutral-700 leading-relaxed">
              In accordance with CCRAS intellectual property notices and training governance regulations, items from standardized national scales are not stored in this prototype. Live questionnaire editing is locked for restricted metadata entries. Use the synthetic demo instruments for digital builder configuration.
            </div>
          </div>
        </div>
      )}

      {/* 3-Pane Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[600px]">
        {/* ========================================================================= */}
        {/* PANE 1: Section & Item Navigator (3 cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 bg-white rounded-sm border border-neutral-200 shadow-xs flex flex-col h-[750px] overflow-hidden">
          <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <span className="font-semibold text-xs text-neutral-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-neutral-600" />
              Questionnaire Structure
            </span>
            {isDraft && (
              <button
                onClick={handleAddSection}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 rounded-xs transition-colors"
                title="Add New Section"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Section</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {sections.map((sec, secIdx) => {
              const secItems = items.filter((it) => it.sectionId === sec.sectionId);
              const isSelectedSec = selectedSectionId === sec.sectionId;

              return (
                <div
                  key={sec.sectionId}
                  className={`border rounded-sm transition-all overflow-hidden ${
                    isSelectedSec ? 'border-amber-600 bg-amber-50/20' : 'border-neutral-200 bg-white'
                  }`}
                >
                  {/* Section Bar */}
                  <div
                    onClick={() => {
                      setSelectedSectionId(sec.sectionId);
                      setSectionForm({
                        sectionCode: sec.sectionCode,
                        title: sec.title,
                        description: sec.description || '',
                      });
                    }}
                    className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex-1 pr-2">
                      <div className="text-[10px] font-mono text-neutral-500 uppercase">{sec.sectionCode}</div>
                      <div className="font-semibold text-xs text-neutral-900 truncate">{sec.title}</div>
                    </div>

                    {/* Touch / Mobile Up & Down Controls */}
                    {isDraft && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleMoveSection(secIdx, 'UP')}
                          disabled={secIdx === 0}
                          className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 rounded-xs"
                          title="Move Section Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveSection(secIdx, 'DOWN')}
                          disabled={secIdx === sections.length - 1}
                          className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 rounded-xs"
                          title="Move Section Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Nested Items List */}
                  <div className="border-t border-neutral-100 bg-neutral-50/60 p-2 space-y-1">
                    {secItems.map((it, itIdx) => {
                      const isSelectedIt = selectedItemId === it.itemId;

                      return (
                        <div
                          key={it.itemId}
                          onClick={() => loadItemToForm(it)}
                          className={`p-2 rounded-sm text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isSelectedIt
                              ? 'bg-amber-100 text-amber-950 font-medium border border-amber-300'
                              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                          }`}
                        >
                          <div className="truncate flex-1 pr-2">
                            <span className="font-mono text-[10px] text-neutral-500 mr-1.5">{it.itemCode}</span>
                            <span className="truncate">{it.questionText}</span>
                          </div>

                          {isDraft && (
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleMoveItem(itIdx, 'UP')}
                                disabled={itIdx === 0}
                                className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-30"
                                title="Move Item Up"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => handleMoveItem(itIdx, 'DOWN')}
                                disabled={itIdx === secItems.length - 1}
                                className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-30"
                                title="Move Item Down"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(it.itemId)}
                                className="p-1 text-red-500 hover:text-red-700"
                                title="Delete Item"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isDraft && isSelectedSec && (
                      <button
                        onClick={handleAddItem}
                        className="w-full mt-1 py-1.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100 border border-dashed border-amber-300 rounded-sm flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Question Item</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANE 2: Item & Section Editor Canvas (6 cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 bg-white rounded-sm border border-neutral-200 shadow-xs flex flex-col h-[750px] overflow-hidden">
          <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <span className="font-semibold text-xs text-neutral-800">
              {selectedItemId ? 'Question Item Editor' : 'Section Properties'}
            </span>
            {isDraft && (
              <button
                onClick={selectedItemId ? handleSaveItem : handleSaveSection}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-sm shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {selectedItemId ? (
              /* ITEM EDITOR FORM */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Item Identifier / Code *
                    </label>
                    <input
                      type="text"
                      value={itemForm.itemCode}
                      onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value })}
                      disabled={!isDraft}
                      className="w-full border border-neutral-300 rounded-sm px-3 py-1.5 font-mono text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Item Response Type *
                    </label>
                    <select
                      value={itemForm.itemType}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, itemType: e.target.value as AssessmentItemType })
                      }
                      disabled={!isDraft}
                      className="w-full border border-neutral-300 rounded-sm px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
                    >
                      <option value="SINGLE_CHOICE">Single Choice (Radio)</option>
                      <option value="MULTI_CHOICE">Multiple Choice (Checkboxes)</option>
                      <option value="YES_NO">Yes / No Toggle</option>
                      <option value="SCALE">Discrete Scale (1 to 5)</option>
                      <option value="TEXT">Short Text Field</option>
                      <option value="LONG_TEXT">Clinical Long Text</option>
                      <option value="INTEGER">Integer Number</option>
                      <option value="DECIMAL">Decimal Value</option>
                      <option value="DATE">Date Picker</option>
                      <option value="BODY_DIAGRAM">Anatomical Body Location</option>
                      <option value="INSTRUCTION">Clinical Instruction Card</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Question Text / Stem *
                  </label>
                  <textarea
                    value={itemForm.questionText}
                    onChange={(e) => setItemForm({ ...itemForm, questionText: e.target.value })}
                    rows={2}
                    disabled={!isDraft}
                    className="w-full border border-neutral-300 rounded-sm px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Clinical Guidance / Help Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={itemForm.helpText}
                    onChange={(e) => setItemForm({ ...itemForm, helpText: e.target.value })}
                    disabled={!isDraft}
                    placeholder="e.g. Inspect tongue coating or palpate radial pulse"
                    className="w-full border border-neutral-300 rounded-sm px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="requiredToggle"
                    checked={itemForm.required}
                    onChange={(e) => setItemForm({ ...itemForm, required: e.target.checked })}
                    disabled={!isDraft || itemForm.itemType === 'INSTRUCTION'}
                    className="rounded-xs text-amber-800"
                  />
                  <label htmlFor="requiredToggle" className="font-semibold text-neutral-800 cursor-pointer">
                    Mandatory Response (Required for submission)
                  </label>
                </div>

                {/* RESPONSE DEFINITION: OPTIONS (Choice types) */}
                {(itemForm.itemType === 'SINGLE_CHOICE' || itemForm.itemType === 'MULTI_CHOICE') && (
                  <div className="pt-3 border-t border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-neutral-800">Response Options</span>
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextIdx = itemForm.options.length + 1;
                            setItemForm({
                              ...itemForm,
                              options: [
                                ...itemForm.options,
                                {
                                  optionId: `OPT_${nextIdx}`,
                                  value: nextIdx.toString(),
                                  label: `Option ${nextIdx}`,
                                  order: nextIdx,
                                },
                              ],
                            });
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Option</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {itemForm.options.map((opt, optIdx) => (
                        <div key={opt.optionId || optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.value}
                            placeholder="Value"
                            disabled={!isDraft}
                            onChange={(e) => {
                              const updated = [...itemForm.options];
                              updated[optIdx].value = e.target.value;
                              setItemForm({ ...itemForm, options: updated });
                            }}
                            className="w-20 border border-neutral-300 rounded-sm px-2 py-1 font-mono text-[11px] disabled:bg-neutral-100"
                          />
                          <input
                            type="text"
                            value={opt.label}
                            placeholder="Label"
                            disabled={!isDraft}
                            onChange={(e) => {
                              const updated = [...itemForm.options];
                              updated[optIdx].label = e.target.value;
                              setItemForm({ ...itemForm, options: updated });
                            }}
                            className="flex-1 border border-neutral-300 rounded-sm px-2 py-1 text-xs disabled:bg-neutral-100"
                          />
                          {isDraft && itemForm.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setItemForm({
                                  ...itemForm,
                                  options: itemForm.options.filter((_, idx) => idx !== optIdx),
                                });
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RESPONSE DEFINITION: SCALE */}
                {itemForm.itemType === 'SCALE' && (
                  <div className="pt-3 border-t border-neutral-200 space-y-3">
                    <span className="font-semibold text-xs text-neutral-800">Discrete Rating Scale Bounds</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-600 mb-1">Minimum Value</label>
                        <input
                          type="number"
                          value={itemForm.scaleMin}
                          onChange={(e) => setItemForm({ ...itemForm, scaleMin: Number(e.target.value) })}
                          disabled={!isDraft}
                          className="w-full border border-neutral-300 rounded-sm px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-600 mb-1">Maximum Value</label>
                        <input
                          type="number"
                          value={itemForm.scaleMax}
                          onChange={(e) => setItemForm({ ...itemForm, scaleMax: Number(e.target.value) })}
                          disabled={!isDraft}
                          className="w-full border border-neutral-300 rounded-sm px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-600 mb-1">Min Label (Anchor)</label>
                        <input
                          type="text"
                          value={itemForm.minLabel}
                          onChange={(e) => setItemForm({ ...itemForm, minLabel: e.target.value })}
                          disabled={!isDraft}
                          className="w-full border border-neutral-300 rounded-sm px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-600 mb-1">Max Label (Anchor)</label>
                        <input
                          type="text"
                          value={itemForm.maxLabel}
                          onChange={(e) => setItemForm({ ...itemForm, maxLabel: e.target.value })}
                          disabled={!isDraft}
                          className="w-full border border-neutral-300 rounded-sm px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SECTION PROPERTIES FORM */
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Section Code *
                  </label>
                  <input
                    type="text"
                    value={sectionForm.sectionCode}
                    onChange={(e) => setSectionForm({ ...sectionForm, sectionCode: e.target.value })}
                    disabled={!isDraft}
                    className="w-full border border-neutral-300 rounded-sm px-3 py-1.5 font-mono text-xs disabled:bg-neutral-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                    disabled={!isDraft}
                    className="w-full border border-neutral-300 rounded-sm px-3 py-1.5 text-xs disabled:bg-neutral-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Section Description / Protocol Notes
                  </label>
                  <textarea
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                    rows={3}
                    disabled={!isDraft}
                    className="w-full border border-neutral-300 rounded-sm px-3 py-1.5 text-xs disabled:bg-neutral-100"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANE 3: Branching Rules & Validation Inspector (3 cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 bg-white rounded-sm border border-neutral-200 shadow-xs flex flex-col h-[750px] overflow-hidden">
          <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <span className="font-semibold text-xs text-neutral-800 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-neutral-600" />
              Branching & Validation
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* Live Validation Panel */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-800">Validation Engine</span>
                {validationResult?.isValid ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-xs border border-emerald-300">
                    <CheckCircle className="w-3 h-3" />
                    Valid & Runnable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded-xs border border-red-300">
                    <AlertTriangle className="w-3 h-3" />
                    {validationResult?.errors.length || 0} Error(s)
                  </span>
                )}
              </div>

              {/* Validation Messages */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {validationResult?.errors.map((err, idx) => (
                  <div key={idx} className="p-2 bg-red-50 border border-red-200 text-red-900 rounded-xs text-[11px]">
                    <div className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      [{err.code}]
                    </div>
                    <div className="mt-0.5">{err.message}</div>
                  </div>
                ))}

                {validationResult?.warnings.map((warn, idx) => (
                  <div key={idx} className="p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xs text-[11px]">
                    <div className="font-semibold flex items-center gap-1">
                      <Info className="w-3 h-3 text-amber-600" />
                      [{warn.code}]
                    </div>
                    <div className="mt-0.5">{warn.message}</div>
                  </div>
                ))}

                {validationResult?.isValid && validationResult.warnings.length === 0 && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xs text-[11px] flex items-center gap-1.5 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>All questionnaire items, scales, and rules passed verification.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Branching Logic Section */}
            <div className="pt-3 border-t border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-800">Branching Rules</span>
                  <p className="text-[10px] text-neutral-500">Deterministic conditional logic</p>
                </div>
                {isDraft && (
                  <button
                    onClick={() => setShowAddRuleModal(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Rule</span>
                  </button>
                )}
              </div>

              {rules.length === 0 ? (
                <div className="p-3 text-center text-neutral-400 text-[11px] bg-neutral-50 rounded-xs border border-dashed border-neutral-200">
                  No conditional branching rules defined. All items display sequentially.
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule) => {
                    const srcItem = items.find((it) => it.itemId === rule.sourceItemId);
                    const tgtItem = items.find((it) => it.itemId === rule.targetItemId);

                    return (
                      <div
                        key={rule.ruleId}
                        className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xs text-[11px] space-y-1 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900">{rule.action}</span>
                          {isDraft && (
                            <button
                              onClick={() => handleDeleteRule(rule.ruleId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-neutral-600 leading-snug">
                          When <strong>{srcItem?.itemCode || rule.sourceItemId}</strong> {rule.operator}{' '}
                          {rule.expectedValue !== undefined ? `"${rule.expectedValue}"` : ''}
                        </div>
                        <div className="text-amber-800 font-medium">
                          → {rule.action} {tgtItem?.itemCode || rule.targetItemId || rule.targetSectionId}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Branching Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm shadow-xl border border-neutral-300 w-full max-w-md p-5 space-y-4 text-xs">
            <h3 className="font-serif font-bold text-sm text-neutral-900">
              Add Conditional Branching Rule
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Source Item (Condition)</label>
                <select
                  value={newRule.sourceItemId}
                  onChange={(e) => setNewRule({ ...newRule, sourceItemId: e.target.value })}
                  className="w-full border border-neutral-300 rounded-sm px-2 py-1.5 text-xs"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map((it) => (
                    <option key={it.itemId} value={it.itemId}>
                      {it.itemCode} — {it.questionText}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Operator</label>
                  <select
                    value={newRule.operator}
                    onChange={(e) =>
                      setNewRule({ ...newRule, operator: e.target.value as AssessmentRuleOperator })
                    }
                    className="w-full border border-neutral-300 rounded-sm px-2 py-1.5 text-xs"
                  >
                    <option value="EQUALS">EQUALS</option>
                    <option value="NOT_EQUALS">NOT EQUALS</option>
                    <option value="CONTAINS">CONTAINS</option>
                    <option value="GREATER_THAN">GREATER THAN</option>
                    <option value="LESS_THAN">LESS THAN</option>
                    <option value="IS_ANSWERED">IS ANSWERED</option>
                    <option value="IS_UNANSWERED">IS UNANSWERED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Expected Value</label>
                  <input
                    type="text"
                    value={newRule.expectedValue}
                    placeholder="e.g. YES, 1, or text"
                    onChange={(e) => setNewRule({ ...newRule, expectedValue: e.target.value })}
                    className="w-full border border-neutral-300 rounded-sm px-2 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Action</label>
                <select
                  value={newRule.action}
                  onChange={(e) =>
                    setNewRule({ ...newRule, action: e.target.value as AssessmentRuleAction })
                  }
                  className="w-full border border-neutral-300 rounded-sm px-2 py-1.5 text-xs"
                >
                  <option value="SHOW_ITEM">SHOW ITEM</option>
                  <option value="HIDE_ITEM">HIDE ITEM</option>
                  <option value="SHOW_SECTION">SHOW SECTION</option>
                  <option value="HIDE_SECTION">HIDE SECTION</option>
                  <option value="SKIP_TO_ITEM">SKIP TO ITEM</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Target Item</label>
                <select
                  value={newRule.targetItemId}
                  onChange={(e) => setNewRule({ ...newRule, targetItemId: e.target.value })}
                  className="w-full border border-neutral-300 rounded-sm px-2 py-1.5 text-xs"
                >
                  <option value="">-- Choose Target Item --</option>
                  {items.map((it) => (
                    <option key={it.itemId} value={it.itemId}>
                      {it.itemCode} — {it.questionText}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="px-3 py-1.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddRule}
                disabled={!newRule.sourceItemId || (!newRule.targetItemId && !newRule.targetSectionId)}
                className="px-3 py-1.5 text-white bg-amber-800 hover:bg-amber-900 disabled:opacity-50 rounded-sm"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
