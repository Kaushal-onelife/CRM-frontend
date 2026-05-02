import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../constants/theme";

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
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={open}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="calendar"
          size={18}
          color={COLORS.gray}
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
              color={COLORS.gray}
            />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

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
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...FONTS.medium,
    marginBottom: 6,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    ...FONTS.regular,
    fontSize: 14,
    flex: 1,
    color: "#111",
  },
  placeholder: {
    color: COLORS.gray,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    paddingBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  cancelText: {
    ...FONTS.medium,
    color: COLORS.gray,
    fontSize: 15,
  },
  confirmText: {
    ...FONTS.bold,
    color: COLORS.primary,
    fontSize: 15,
  },
});
