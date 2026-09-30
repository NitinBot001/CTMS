/**
 * Declarative Assessment Branching & Rule Engine — Stage 3
 * 
 * Evaluates deterministic conditional branching rules against current participant responses.
 * Detects dynamically visible, hidden, and skipped items and sections.
 * 
 * Rules are purely data-driven (NO LLM, NO eval, NO arbitrary code execution).
 */

import {
  AssessmentItem,
  AssessmentSection,
  AssessmentRule,
  AssessmentResponse,
} from '../types';

export interface VisibilityState {
  hiddenItemIds: Set<string>;
  hiddenSectionIds: Set<string>;
  skippedItemIds: Set<string>;
}

export interface CompletionState {
  isComplete: boolean;
  totalVisibleItems: number;
  answeredItemsCount: number;
  completionPercentage: number;
  unansweredRequiredItemIds: string[];
}

export class AssessmentBranchingEngine {
  /**
   * Helper to extract a comparable scalar or array value from an AssessmentResponse
   */
  public static extractValue(response?: AssessmentResponse): any {
    if (!response) return undefined;
    if (response.value !== undefined && response.value !== null) {
      return response.value;
    }
    if (response.selectedOptionIds && response.selectedOptionIds.length > 0) {
      return response.selectedOptionIds;
    }
    if (response.textValue !== undefined) return response.textValue;
    if (response.numericValue !== undefined) return response.numericValue;
    if (response.booleanValue !== undefined) return response.booleanValue;
    if (response.dateValue !== undefined) return response.dateValue;
    if (response.bodyLocationValue !== undefined) return response.bodyLocationValue;
    return undefined;
  }

  /**
   * Evaluates a single rule operator against the response value
   */
  public static evaluateRuleCondition(
    operator: AssessmentRule['operator'],
    expectedValue: any,
    actualValue: any
  ): boolean {
    switch (operator) {
      case 'IS_ANSWERED':
        if (actualValue === undefined || actualValue === null) return false;
        if (typeof actualValue === 'string' && actualValue.trim() === '') return false;
        if (Array.isArray(actualValue) && actualValue.length === 0) return false;
        return true;

      case 'IS_UNANSWERED':
        if (actualValue === undefined || actualValue === null) return true;
        if (typeof actualValue === 'string' && actualValue.trim() === '') return true;
        if (Array.isArray(actualValue) && actualValue.length === 0) return true;
        return false;

      case 'EQUALS': {
        if (actualValue === undefined || actualValue === null) return false;
        // String compare or boolean or number
        if (typeof actualValue === 'boolean' || typeof expectedValue === 'boolean') {
          return Boolean(actualValue) === Boolean(expectedValue);
        }
        if (Array.isArray(actualValue)) {
          return actualValue.length === 1 && String(actualValue[0]) === String(expectedValue);
        }
        return String(actualValue).toLowerCase().trim() === String(expectedValue).toLowerCase().trim();
      }

      case 'NOT_EQUALS': {
        if (actualValue === undefined || actualValue === null) return true;
        if (typeof actualValue === 'boolean' || typeof expectedValue === 'boolean') {
          return Boolean(actualValue) !== Boolean(expectedValue);
        }
        if (Array.isArray(actualValue)) {
          return !(actualValue.length === 1 && String(actualValue[0]) === String(expectedValue));
        }
        return String(actualValue).toLowerCase().trim() !== String(expectedValue).toLowerCase().trim();
      }

      case 'CONTAINS': {
        if (actualValue === undefined || actualValue === null) return false;
        if (Array.isArray(actualValue)) {
          return actualValue.some((v) => String(v).toLowerCase().trim() === String(expectedValue).toLowerCase().trim());
        }
        return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase().trim());
      }

      case 'GREATER_THAN': {
        const numActual = Number(actualValue);
        const numExpected = Number(expectedValue);
        if (isNaN(numActual) || isNaN(numExpected)) return false;
        return numActual > numExpected;
      }

      case 'LESS_THAN': {
        const numActual = Number(actualValue);
        const numExpected = Number(expectedValue);
        if (isNaN(numActual) || isNaN(numExpected)) return false;
        return numActual < numExpected;
      }

      case 'IN': {
        if (actualValue === undefined || actualValue === null) return false;
        if (Array.isArray(expectedValue)) {
          return expectedValue.some(
            (v) => String(v).toLowerCase().trim() === String(actualValue).toLowerCase().trim()
          );
        }
        return false;
      }

      case 'NOT_IN': {
        if (actualValue === undefined || actualValue === null) return true;
        if (Array.isArray(expectedValue)) {
          return !expectedValue.some(
            (v) => String(v).toLowerCase().trim() === String(actualValue).toLowerCase().trim()
          );
        }
        return true;
      }

      default:
        return false;
    }
  }

  /**
   * Computes visibility and skip state for all items and sections based on responses and rules.
   */
  public static computeVisibility(
    items: AssessmentItem[],
    _sections: AssessmentSection[],
    rules: AssessmentRule[],
    responses: Record<string, AssessmentResponse>
  ): VisibilityState {
    const hiddenItemIds = new Set<string>();
    const hiddenSectionIds = new Set<string>();
    const skippedItemIds = new Set<string>();

    const getGlobalItemOrder = (it: AssessmentItem): number => {
      const sec = _sections.find((s) => s.sectionId === it.sectionId);
      const secOrder = sec ? sec.order : 0;
      return secOrder * 10000 + (it.order || 0);
    };

    // Items with SHOW_ITEM rules default to hidden unless their condition is met
    const itemsControlledByShowRule = new Set<string>();
    const sectionsControlledByShowRule = new Set<string>();

    for (const rule of rules) {
      if (!rule.active) continue;
      if (rule.action === 'SHOW_ITEM' && rule.targetItemId) {
        itemsControlledByShowRule.add(rule.targetItemId);
      }
      if (rule.action === 'SHOW_SECTION' && rule.targetSectionId) {
        sectionsControlledByShowRule.add(rule.targetSectionId);
      }
    }

    // Default items controlled by SHOW_ITEM to hidden initially
    for (const id of itemsControlledByShowRule) {
      hiddenItemIds.add(id);
    }
    for (const id of sectionsControlledByShowRule) {
      hiddenSectionIds.add(id);
    }

    // Sort rules by priority
    const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Evaluate rules
    for (const rule of sortedRules) {
      if (!rule.active) continue;

      const response = responses[rule.sourceItemId];
      const actualValue = this.extractValue(response);
      let isMatched = this.evaluateRuleCondition(rule.operator, rule.expectedValue, actualValue);

      // Support compound rules with logical AND / OR
      if (rule.logicalOperator && rule.secondarySourceItemId && rule.secondaryOperator) {
        const secResponse = responses[rule.secondarySourceItemId];
        const secActualValue = this.extractValue(secResponse);
        const secMatched = this.evaluateRuleCondition(
          rule.secondaryOperator,
          rule.secondaryExpectedValue,
          secActualValue
        );
        if (rule.logicalOperator === 'AND') {
          isMatched = isMatched && secMatched;
        } else if (rule.logicalOperator === 'OR') {
          isMatched = isMatched || secMatched;
        }
      }

      switch (rule.action) {
        case 'SHOW_ITEM':
          if (rule.targetItemId) {
            if (isMatched) {
              hiddenItemIds.delete(rule.targetItemId);
            }
          }
          break;

        case 'HIDE_ITEM':
          if (rule.targetItemId) {
            if (isMatched) {
              hiddenItemIds.add(rule.targetItemId);
            }
          }
          break;

        case 'SHOW_SECTION':
          if (rule.targetSectionId) {
            if (isMatched) {
              hiddenSectionIds.delete(rule.targetSectionId);
            }
          }
          break;

        case 'HIDE_SECTION':
          if (rule.targetSectionId) {
            if (isMatched) {
              hiddenSectionIds.add(rule.targetSectionId);
            }
          }
          break;

        case 'SKIP_TO_ITEM':
          if (rule.targetItemId && isMatched) {
            // All items ordered between sourceItemId and targetItemId are skipped
            const sorted = [...items].sort((a, b) => getGlobalItemOrder(a) - getGlobalItemOrder(b));
            const srcIdx = sorted.findIndex((it) => it.itemId === rule.sourceItemId);
            const tgtIdx = sorted.findIndex((it) => it.itemId === rule.targetItemId);
            if (srcIdx >= 0 && tgtIdx > srcIdx) {
              for (let i = srcIdx + 1; i < tgtIdx; i++) {
                skippedItemIds.add(sorted[i].itemId);
              }
            }
          }
          break;

        case 'SKIP_TO_SECTION':
          if (rule.targetSectionId && isMatched) {
            const srcItem = items.find((it) => it.itemId === rule.sourceItemId);
            const tgtSec = _sections.find((s) => s.sectionId === rule.targetSectionId);
            if (srcItem && tgtSec) {
              const srcSec = _sections.find((s) => s.sectionId === srcItem.sectionId);
              const srcOrder = srcSec ? srcSec.order : 0;
              const tgtOrder = tgtSec.order;
              // Skip items whose section order lies between current section and target section
              for (const it of items) {
                const itemSec = _sections.find((s) => s.sectionId === it.sectionId);
                const itemSecOrder = itemSec ? itemSec.order : 0;
                if (itemSecOrder >= srcOrder && itemSecOrder < tgtOrder && it.itemId !== rule.sourceItemId) {
                  skippedItemIds.add(it.itemId);
                }
              }
            }
          }
          break;

        case 'END_ASSESSMENT':
          if (isMatched) {
            // Skip all remaining items after this source item
            const sorted = [...items].sort((a, b) => getGlobalItemOrder(a) - getGlobalItemOrder(b));
            const srcIdx = sorted.findIndex((it) => it.itemId === rule.sourceItemId);
            if (srcIdx >= 0) {
              for (let i = srcIdx + 1; i < sorted.length; i++) {
                skippedItemIds.add(sorted[i].itemId);
              }
            }
          }
          break;

        case 'DISABLE_ITEM':
          if (rule.targetItemId && isMatched) {
            hiddenItemIds.add(rule.targetItemId);
          }
          break;

        case 'ENABLE_ITEM':
          if (rule.targetItemId && isMatched) {
            hiddenItemIds.delete(rule.targetItemId);
          }
          break;

        case 'REQUIRE_ITEM':
        case 'OPTIONAL_ITEM':
          // Evaluated during schema validation / item metadata
          break;
      }
    }

    // If an entire section is hidden, all its items are considered hidden as well
    for (const item of items) {
      if (hiddenSectionIds.has(item.sectionId)) {
        hiddenItemIds.add(item.itemId);
      }
    }

    return {
      hiddenItemIds,
      hiddenSectionIds,
      skippedItemIds,
    };
  }

  /**
   * Evaluates completion progress against visible items.
   * Items that are conditionally hidden or skipped NEVER block completion.
   */
  public static evaluateCompletion(
    items: AssessmentItem[],
    sections: AssessmentSection[],
    rules: AssessmentRule[],
    responses: Record<string, AssessmentResponse>
  ): CompletionState {
    const visibility = this.computeVisibility(items, sections, rules, responses);

    const activeItems = items.filter(
      (it) => it.active !== false && !visibility.hiddenItemIds.has(it.itemId) && !visibility.skippedItemIds.has(it.itemId)
    );

    // Items of type INSTRUCTION do not require responses
    const answerableItems = activeItems.filter((it) => it.itemType !== 'INSTRUCTION');
    const totalVisible = answerableItems.length;

    let answeredCount = 0;
    const unansweredRequiredItemIds: string[] = [];

    for (const it of answerableItems) {
      const resp = responses[it.itemId];
      const val = this.extractValue(resp);
      const isAnswered = this.evaluateRuleCondition('IS_ANSWERED', null, val);

      if (isAnswered) {
        answeredCount++;
      } else if (it.required) {
        unansweredRequiredItemIds.push(it.itemId);
      }
    }

    const completionPercentage = totalVisible > 0 ? Math.round((answeredCount / totalVisible) * 100) : 100;
    const isComplete = unansweredRequiredItemIds.length === 0;

    return {
      isComplete,
      totalVisibleItems: totalVisible,
      answeredItemsCount: answeredCount,
      completionPercentage,
      unansweredRequiredItemIds,
    };
  }
}
