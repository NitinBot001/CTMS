#!/usr/bin/env bash

set -o pipefail

OUTPUT="SEGMENT_E_AUDIT_CODE.md"

# Start fresh
: > "$OUTPUT"

append_header() {
  local filepath="$1"

  {
    echo ""
    echo "---"
    echo ""
    echo "## FILE: $filepath"
    echo ""
  } >> "$OUTPUT"
}

append_file() {
  local filepath="$1"

  if [ ! -f "$filepath" ]; then
    echo "⚠️ File not found: $filepath" >&2
    return 0
  fi

  append_header "$filepath"

  case "$filepath" in
    *.tsx|*.ts)
      echo '```typescript' >> "$OUTPUT"
      ;;
    *.css)
      echo '```css' >> "$OUTPUT"
      ;;
    *.json)
      echo '```json' >> "$OUTPUT"
      ;;
    *.md)
      echo '```markdown' >> "$OUTPUT"
      ;;
    *)
      echo '```text' >> "$OUTPUT"
      ;;
  esac

  cat "$filepath" >> "$OUTPUT"

  echo "" >> "$OUTPUT"
  echo '```' >> "$OUTPUT"
}

# ============================================================
# HEADER
# ============================================================

cat >> "$OUTPUT" <<'HEADER'
# AIIA CTMS — Segment E Audit Code

This file contains source code required for auditing
Phase 1 — Segment E: Protocol Compliance & Deviations.

Generated automatically for code audit.

HEADER

echo "Generated: $(date)" >> "$OUTPUT"

# ============================================================
# PROJECT STRUCTURE
# ============================================================

{
  echo ""
  echo "---"
  echo ""
  echo "## PROJECT STRUCTURE — RELEVANT SOURCE FILES"
  echo ""
  echo '```text'

  if [ -d "src" ]; then
    find src \
      -type f \
      \( -name "*.ts" -o -name "*.tsx" \) \
      | sort \
      | grep -Ei \
        '(compliance|deviation|services\.test|index\.ts|interfaces\.ts|mockData|StudyContext|ParticipantDetail|VisitDetail|SafetyAndCompliance)' \
      || true
  fi

  echo '```'
} >> "$OUTPUT"

# ============================================================
# CORE DOMAIN
# ============================================================

append_file "src/index.ts"
append_file "src/interfaces.ts"

# ============================================================
# ALL COMPLIANCE / DEVIATION FILES
# ============================================================

if [ -d "src" ]; then

  while IFS= read -r filepath; do
    append_file "$filepath"
  done < <(
    find src \
      -type f \
      \( -name "*.ts" -o -name "*.tsx" \) \
      | sort \
      | grep -Ei \
        '(compliance|protocol.?deviation|deviation)' \
      || true
  )

fi

# ============================================================
# MOCK DATA
# ============================================================

append_file "src/mockData.ts"

# ============================================================
# TEST FILES
# ============================================================

if [ -d "src" ]; then

  while IFS= read -r filepath; do
    append_file "$filepath"
  done < <(
    find src \
      -type f \
      \( -name "*.test.ts" -o -name "*.test.tsx" \) \
      | sort \
      || true
  )

fi

# ============================================================
# CROSS-MODULE INTEGRATION
# ============================================================

if [ -d "src" ]; then

  while IFS= read -r filepath; do
    append_file "$filepath"
  done < <(
    find src \
      -type f \
      \( -name "*.ts" -o -name "*.tsx" \) \
      | sort \
      | grep -Ei \
        '(SafetyAndComplianceCards|ParticipantDetailPage|VisitDetailPage|StudyContext)' \
      || true
  )

fi

# ============================================================
# ROUTING
# ============================================================

append_file "src/index.tsx"

# ============================================================
# DESIGN
# ============================================================

append_file "DESIGN.md"

# ============================================================
# PROJECT CONFIG
# ============================================================

append_file "package.json"
append_file "tsconfig.json"
append_file "vite.config.ts"

# ============================================================
# SUMMARY
# ============================================================

{
  echo ""
  echo "---"
  echo ""
  echo "## EXPORT SUMMARY"
  echo ""
  echo "Generated: $(date)"
  echo ""
  echo "Output file:"
  echo "$OUTPUT"
  echo ""
  echo "Size:"
  wc -c < "$OUTPUT"
  echo ""
  echo "Included source files:"
  grep '^## FILE:' "$OUTPUT" \
    | sed 's/^## FILE: /- /' \
    || true
} >> "$OUTPUT"

echo ""
echo "=============================================="
echo " Segment E Audit Export Complete"
echo "=============================================="
echo ""
echo "Output:"
echo "  $OUTPUT"
echo ""
echo "Size:"
wc -c < "$OUTPUT"
echo ""
echo "Included files:"
grep '^## FILE:' "$OUTPUT" \
  | sed 's/^## FILE: /  - /' \
  || true
echo ""
