import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import { unstable_createElement } from "react-native-web";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(value) {
  if (!value) return "";
  const d = parseISODate(value);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select date",
  minimumDate,
  minDate,
  maximumDate,
  disabled = false,
}) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(parseISODate(value));

  // Backward-compat: older callsites pass minDate (Date or YYYY-MM-DD string).
  const effectiveMin =
    minimumDate ||
    (minDate
      ? minDate instanceof Date
        ? minDate
        : parseISODate(minDate)
      : undefined);

  const open = () => {
    if (disabled) return;
    setTempDate(parseISODate(value));
    setShow(true);
  };

  const handleAndroid = (event, selected) => {
    setShow(false);
    if (event.type === "set" && selected) {
      onChange(toISODate(selected));
    }
  };

  const handleIOSChange = (_event, selected) => {
    if (selected) setTempDate(selected);
  };

  const confirmIOS = () => {
    setShow(false);
    onChange(toISODate(tempDate));
  };

  const cancelIOS = () => setShow(false);

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {Platform.OS === "web" ? (
        <View style={[styles.field, disabled && styles.fieldDisabled]}>
          <MaterialCommunityIcons
            name="calendar"
            size={18}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <View style={styles.webInputWrap}>
            {unstable_createElement("input", {
              type: "date",
              value: value || "",
              min: effectiveMin ? toISODate(effectiveMin) : undefined,
              max: maximumDate ? toISODate(maximumDate) : undefined,
              disabled,
              "aria-label": label || placeholder,
              onChange: (event) => onChange(event.target.value || ""),
              style: {
                borderWidth: 0,
                backgroundColor: "transparent",
                color: colors.text,
                fontSize: 14,
                fontFamily:
                  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                outlineStyle: "none",
                colorScheme: "light dark",
                width: "100%",
                minWidth: 0,
              },
            })}
          </View>
          {value ? (
            <TouchableOpacity
              onPress={() => onChange("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.field, disabled && styles.fieldDisabled]}
          onPress={open}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="calendar"
            size={18}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={[styles.text, !value && styles.placeholder]}>
            {value ? formatDisplay(value) : placeholder}
          </Text>
          {value ? (
            <TouchableOpacity
              onPress={() => onChange("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      )}

      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleAndroid}
          minimumDate={effectiveMin}
          maximumDate={maximumDate}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="slide"
          visible={show}
          onRequestClose={cancelIOS}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={cancelIOS}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmIOS}>
                  <Text style={styles.confirmText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleIOSChange}
                minimumDate={effectiveMin}
                maximumDate={maximumDate}
                themeVariant={isDark ? "dark" : "light"}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.card,
    },
    fieldDisabled: {
      opacity: 0.5,
    },
    icon: {
      marginRight: 8,
    },
    text: {
      fontSize: 14,
      flex: 1,
      color: colors.text,
    },
    webInputWrap: {
      flex: 1,
      justifyContent: "center",
    },
    placeholder: {
      color: colors.textSecondary,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    modalSheet: {
      backgroundColor: colors.card,
      paddingBottom: 24,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cancelText: {
      fontWeight: "600",
      color: colors.textSecondary,
      fontSize: 15,
    },
    confirmText: {
      fontWeight: "700",
      color: colors.primary,
      fontSize: 15,
    },
  });
