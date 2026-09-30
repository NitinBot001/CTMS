/**
 * Centralized Assessment Validation Engine — Stage 3
 * 
 * Deterministic validation for questionnaire content, version structures,
 * response definitions, item references, cycle detection, and reachability.
 * 
 * Emits errors (blocking publication), warnings (advisory), and info.
 */

import {
  AssessmentInstrumentVersion,
  AssessmentSection,
  AssessmentItem,
  AssessmentRule,
  AssessmentValidationResult,
  AssessmentValidationError,
  AssessmentValidationWarning,
  AssessmentValidationInfo,
} from '../types';

export class AssessmentValidationEngine {
  /**
   * Validates complete instrument version content before draft save or publication.
   */
  public static validateVersionContent(
    version: AssessmentInstrumentVersion,
    sections: AssessmentSection[],
    items: AssessmentItem[],
    rules: AssessmentRule[]
  ): AssessmentValidationResult {
    const errors: AssessmentValidationError[] = [];
    const warnings: AssessmentValidationWarning[] = [];
    const info: AssessmentValidationInfo[] = [];

    // 1. Version linkage & status
    if (!version.instrumentId) {
      errors.push({
        path: 'version.instrumentId',
        message: 'Instrument version must be linked to an active instrument.',
        code: 'MISSING_INSTRUMENT_LINKAGE',
      });
    }

    if (!version.versionLabel || version.versionLabel.trim() === '') {
      errors.push({
        path: 'version.versionLabel',
        message: 'Version label is required (e.g. 1.0, 2.0-DRAFT).',
        code: 'MISSING_VERSION_LABEL',
      });
    }

    // 2. Sections validation
    if (sections.length === 0) {
      errors.push({
        path: 'sections',
        message: 'At least one assessment section must be defined.',
        code: 'EMPTY_SECTIONS',
      });
    }

    const sectionIdSet = new Set<string>();
    const sectionCodeSet = new Set<string>();

    for (const section of sections) {
      if (sectionIdSet.has(section.sectionId)) {
        errors.push({
          path: `sections[${section.sectionId}]`,
          message: `Duplicate section ID detected: ${section.sectionId}`,
          code: 'DUPLICATE_SECTION_ID',
        });
      }
      sectionIdSet.add(section.sectionId);

      if (!section.sectionCode || section.sectionCode.trim() === '') {
        errors.push({
          path: `sections[${section.sectionId}].sectionCode`,
          message: 'Section code is required.',
          code: 'MISSING_SECTION_CODE',
        });
      } else {
        const normCode = section.sectionCode.trim().toUpperCase();
        if (sectionCodeSet.has(normCode)) {
          errors.push({
            path: `sections[${section.sectionId}].sectionCode`,
            message: `Duplicate section code: ${section.sectionCode}`,
            code: 'DUPLICATE_SECTION_CODE',
          });
        }
        sectionCodeSet.add(normCode);
      }

      if (!section.title || section.title.trim() === '') {
        errors.push({
          path: `sections[${section.sectionId}].title`,
          message: 'Section title is required.',
          code: 'MISSING_SECTION_TITLE',
        });
      }

      if (section.instrumentVersionId !== version.versionId) {
        errors.push({
          path: `sections[${section.sectionId}].instrumentVersionId`,
          message: `Section ${section.sectionId} references mismatched version ${section.instrumentVersionId} (expected ${version.versionId}).`,
          code: 'ORPHANED_SECTION',
        });
      }
    }

    // 3. Items validation
    if (items.length === 0) {
      errors.push({
        path: 'items',
        message: 'At least one assessment item must be defined.',
        code: 'EMPTY_ITEMS',
      });
    }

    const itemIdSet = new Set<string>();
    const itemCodeSet = new Set<string>();
    const sectionItemCountMap = new Map<string, number>();

    for (const item of items) {
      if (itemIdSet.has(item.itemId)) {
        errors.push({
          path: `items[${item.itemId}]`,
          message: `Duplicate item ID detected: ${item.itemId}`,
          code: 'DUPLICATE_ITEM_ID',
        });
      }
      itemIdSet.add(item.itemId);

      if (!item.itemCode || item.itemCode.trim() === '') {
        errors.push({
          path: `items[${item.itemId}].itemCode`,
          message: 'Item code is required.',
          code: 'MISSING_ITEM_CODE',
        });
      } else {
        const normItemCode = item.itemCode.trim().toUpperCase();
        if (itemCodeSet.has(normItemCode)) {
          errors.push({
            path: `items[${item.itemId}].itemCode`,
            message: `Duplicate item code: ${item.itemCode}`,
            code: 'DUPLICATE_ITEM_CODE',
          });
        }
        itemCodeSet.add(normItemCode);
      }

      if (!item.questionText || item.questionText.trim() === '') {
        errors.push({
          path: `items[${item.itemId}].questionText`,
          message: `Item ${item.itemCode || item.itemId} has empty question text.`,
          code: 'EMPTY_QUESTION_TEXT',
        });
      }

      // Section linkage
      if (!sectionIdSet.has(item.sectionId)) {
        errors.push({
          path: `items[${item.itemId}].sectionId`,
          message: `Item ${item.itemCode || item.itemId} references non-existent section ${item.sectionId}.`,
          code: 'ORPHANED_ITEM',
        });
      } else {
        const count = sectionItemCountMap.get(item.sectionId) || 0;
        sectionItemCountMap.set(item.sectionId, count + 1);
      }

      // Response definition validation
      if (item.itemType === 'SINGLE_CHOICE' || item.itemType === 'MULTI_CHOICE') {
        const options = item.responseDefinition?.options || [];
        if (options.length < 2) {
          errors.push({
            path: `items[${item.itemId}].responseDefinition.options`,
            message: `Choice item ${item.itemCode} requires at least 2 distinct response options.`,
            code: 'INSUFFICIENT_OPTIONS',
          });
        }

        const optionValueSet = new Set<string>();
        for (const opt of options) {
          if (!opt.value || opt.value.trim() === '') {
            errors.push({
              path: `items[${item.itemId}].options[${opt.optionId}].value`,
              message: `Option ${opt.optionId} in item ${item.itemCode} has empty value.`,
              code: 'EMPTY_OPTION_VALUE',
            });
          } else {
            if (optionValueSet.has(opt.value)) {
              errors.push({
                path: `items[${item.itemId}].options[${opt.optionId}].value`,
                message: `Duplicate option value '${opt.value}' in item ${item.itemCode}.`,
                code: 'DUPLICATE_OPTION_VALUE',
              });
            }
            optionValueSet.add(opt.value);
          }
        }
      } else if (item.itemType === 'SCALE') {
        const minVal = item.responseDefinition?.minVal ?? 1;
        const maxVal = item.responseDefinition?.maxVal ?? 5;
        if (minVal >= maxVal) {
          errors.push({
            path: `items[${item.itemId}].responseDefinition.scale`,
            message: `Scale item ${item.itemCode} requires maxVal (${maxVal}) > minVal (${minVal}).`,
            code: 'INVALID_SCALE_RANGE',
          });
        }
      }
    }

    // Check empty sections
    for (const section of sections) {
      const count = sectionItemCountMap.get(section.sectionId) || 0;
      if (count === 0) {
        warnings.push({
          path: `sections[${section.sectionId}]`,
          message: `Section '${section.title}' contains zero items.`,
          code: 'SECTION_WITHOUT_ITEMS',
        });
      }
    }

    // 4. Rules & Branching validation
    const ruleGraph = new Map<string, string[]>(); // item -> [dependent items or skip targets]

    for (const rule of rules) {
      if (!rule.active) continue;

      if (!itemIdSet.has(rule.sourceItemId)) {
        errors.push({
          path: `rules[${rule.ruleId}].sourceItemId`,
          message: `Rule ${rule.ruleId} references non-existent source item ${rule.sourceItemId}.`,
          code: 'ORPHANED_RULE_SOURCE',
        });
      }

      if (['SHOW_ITEM', 'HIDE_ITEM', 'SKIP_TO_ITEM'].includes(rule.action)) {
        if (!rule.targetItemId || !itemIdSet.has(rule.targetItemId)) {
          errors.push({
            path: `rules[${rule.ruleId}].targetItemId`,
            message: `Rule ${rule.ruleId} references non-existent target item ${rule.targetItemId || '(empty)'}.`,
            code: 'INVALID_TARGET_ITEM',
          });
        }
      } else if (rule.targetItemId && !itemIdSet.has(rule.targetItemId)) {
        errors.push({
          path: `rules[${rule.ruleId}].targetItemId`,
          message: `Rule ${rule.ruleId} references non-existent target item ${rule.targetItemId}.`,
          code: 'INVALID_TARGET_ITEM',
        });
      }

      if (['SHOW_SECTION', 'HIDE_SECTION', 'SKIP_TO_SECTION'].includes(rule.action)) {
        if (!rule.targetSectionId || !sectionIdSet.has(rule.targetSectionId)) {
          errors.push({
            path: `rules[${rule.ruleId}].targetSectionId`,
            message: `Rule ${rule.ruleId} references non-existent target section ${rule.targetSectionId || '(empty)'}.`,
            code: 'INVALID_TARGET_SECTION',
          });
        }
      } else if (rule.targetSectionId && !sectionIdSet.has(rule.targetSectionId)) {
        errors.push({
          path: `rules[${rule.ruleId}].targetSectionId`,
          message: `Rule ${rule.ruleId} references non-existent target section ${rule.targetSectionId}.`,
          code: 'INVALID_TARGET_SECTION',
        });
      }

      if (rule.action === 'SKIP_TO_ITEM' || rule.action === 'SHOW_ITEM' || rule.action === 'HIDE_ITEM') {
        if (rule.targetItemId) {
          const list = ruleGraph.get(rule.sourceItemId) || [];
          list.push(rule.targetItemId);
          ruleGraph.set(rule.sourceItemId, list);
        }
      }
    }

    // 5. Cycle Detection in Rule Graph (DFS)
    const visited = new Set<string>();
    const recStack = new Set<string>();
    let cycleDetected = false;
    let cycleNodes: string[] = [];

    const checkCycle = (node: string, path: string[]): boolean => {
      visited.add(node);
      recStack.add(node);

      const neighbors = ruleGraph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (checkCycle(neighbor, [...path, neighbor])) {
            return true;
          }
        } else if (recStack.has(neighbor)) {
          cycleDetected = true;
          cycleNodes = [...path, neighbor];
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const node of ruleGraph.keys()) {
      if (!visited.has(node)) {
        if (checkCycle(node, [node])) {
          break;
        }
      }
    }

    if (cycleDetected) {
      errors.push({
        path: 'rules.branching',
        message: `Circular branching cycle detected in rules: ${cycleNodes.join(' -> ')}`,
        code: 'CIRCULAR_BRANCHING_CYCLE',
      });
    }

    // 6. Reachability check: backward skip / unreachable items
    // Sort items by section order then item order
    const getGlobalItemOrder = (it: AssessmentItem): number => {
      const sec = sections.find((s) => s.sectionId === it.sectionId);
      const secOrder = sec ? sec.order : 0;
      return secOrder * 10000 + (it.order || 0);
    };
    const sortedItems = [...items].sort((a, b) => getGlobalItemOrder(a) - getGlobalItemOrder(b));
    const itemIndexMap = new Map<string, number>();
    sortedItems.forEach((it, idx) => itemIndexMap.set(it.itemId, idx));

    for (const rule of rules) {
      if (!rule.active) continue;
      if (rule.action === 'SKIP_TO_ITEM' && rule.targetItemId) {
        const sourceIdx = itemIndexMap.get(rule.sourceItemId);
        const targetIdx = itemIndexMap.get(rule.targetItemId);
        if (sourceIdx !== undefined && targetIdx !== undefined && targetIdx < sourceIdx) {
          warnings.push({
            path: `rules[${rule.ruleId}]`,
            message: `Rule ${rule.ruleId} performs a backward skip from item index ${sourceIdx} to ${targetIdx}. Ensure this does not create an infinite survey loop.`,
            code: 'BACKWARD_SKIP_LOGIC',
          });
        }
      }
    }

    // 7. Metadata provenance notice
    if (version.contentSource === 'SYNTHETIC_DEMO') {
      info.push({
        path: 'version.contentSource',
        message: 'Instrument configured with SYNTHETIC DEMO CONTENT for trial workflow testing.',
        code: 'SYNTHETIC_DEMO_NOTICE',
      });
    } else if (version.contentSource === 'SOURCE_REFERENCED') {
      info.push({
        path: 'version.contentSource',
        message: 'Instrument is SOURCE REFERENCED with metadata-only registration.',
        code: 'SOURCE_REFERENCED_NOTICE',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  }
}
