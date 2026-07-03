import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Parse "YYYY-MM" -> { year, month(0-indexed) }. Falls back to current month.
function parseKey(key) {
  if (typeof key === "string" && /^\d{4}-\d{2}$/.test(key)) {
    const [y, m] = key.split("-").map(Number);
    return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

const toKey = (year, month) => `${year}-${String(month + 1).padStart(2, "0")}`;

/**
 * A month/year picker in a modal — year arrows plus a 3×4 grid of months.
 * Lets the user reach ANY month (subject to min/max), with no scroller.
 *
 * Props:
 *   visible      — modal open state
 *   value        — selected "YYYY-MM"
 *   onSelect     — (key: "YYYY-MM") => void  (also closes)
 *   onClose      — () => void
 *   maxKey       — latest selectable "YYYY-MM" (default: current month)
 *   minKey       — earliest selectable "YYYY-MM" (optional)
 */
export default function MonthPicker({
  visible,
  value,
  onSelect,
  onClose,
  maxKey,
  minKey,
}) {
  const { colors, radius, spacing } = useTheme();
  const selected = parseKey(value);
  // The year currently being browsed (independent of the selected value).
  const [viewYear, setViewYear] = useState(selected.year);

  // Re-sync the browsed year to the selection each time the modal opens.
  useEffect(() => {
    if (visible) setViewYear(parseKey(value).year);
  }, [visible, value]);

  const now = new Date();
  const max = parseKey(maxKey || toKey(now.getUTCFullYear(), now.getUTCMonth()));
  const min = minKey ? parseKey(minKey) : null;

  // Is (viewYear, monthIndex) selectable given min/max bounds?
  const inRange = (monthIndex) => {
    const v = viewYear * 12 + monthIndex;
    const hi = max.year * 12 + max.month;
    const lo = min ? min.year * 12 + min.month : -Infinity;
    return v <= hi && v >= lo;
  };

  const canPrevYear = min ? viewYear - 1 >= min.year : true;
  const canNextYear = viewYear + 1 <= max.year;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Inner press-catcher so taps on the card don't dismiss. */}
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
            ]}
          >
            {/* Year navigator */}
            <View style={styles.yearRow}>
              <TouchableOpacity
                disabled={!canPrevYear}
                onPress={() => setViewYear((y) => y - 1)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ opacity: canPrevYear ? 1 : 0.3 }}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                {viewYear}
              </Text>
              <TouchableOpacity
                disabled={!canNextYear}
                onPress={() => setViewYear((y) => y + 1)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ opacity: canNextYear ? 1 : 0.3 }}
              >
                <MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Month grid (3 columns × 4 rows) */}
            <View style={styles.grid}>
              {MONTHS.map((label, idx) => {
                const isSelected = selected.year === viewYear && selected.month === idx;
                const enabled = inRange(idx);
                return (
                  <TouchableOpacity
                    key={label}
                    activeOpacity={0.7}
                    disabled={!enabled}
                    style={[
                      styles.cell,
                      {
                        borderRadius: radius.md,
                        backgroundColor: isSelected ? colors.primary : "transparent",
                        borderColor: isSelected ? colors.primary : colors.border,
                        opacity: enabled ? 1 : 0.3,
                      },
                    ]}
                    onPress={() => onSelect(toKey(viewYear, idx))}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isSelected ? "700" : "500",
                        color: isSelected ? colors.onPrimary : colors.text,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: 320,
    maxWidth: "100%",
  },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "31%",
    marginHorizontal: "1.16%",
    marginBottom: 10,
    height: 46,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    marginTop: 6,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
