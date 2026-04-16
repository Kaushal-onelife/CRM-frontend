import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS, FONTS } from "../constants/theme";

/**
 * Reusable date picker field.
 * Props:
 *   label       - field label text
 *   value       - "YYYY-MM-DD" string or ""
 *   onChange    - called with "YYYY-MM-DD" string
 *   placeholder - placeholder text
 *   minDate     - optional minimum Date
 */
export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select date",
  minDate,
}) {
  const [show, setShow] = useState(false);

  const parseDate = (str) => {
    if (!str) return new Date();
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const displayDate = (str) => {
    if (!str) return "";
    const date = parseDate(str);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShow(false);
    if (event.type === "dismissed") {
      setShow(false);
      return;
    }
    if (selectedDate) {
      onChange(formatDate(selectedDate));
      if (Platform.OS === "ios") return; // keep picker open on iOS
    }
  };

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.input} onPress={() => setShow(true)}>
        <Text style={value ? styles.inputText : styles.placeholder}>
          {value ? displayDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {show && (
        <View>
          <DateTimePicker
            value={parseDate(value)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleChange}
            minimumDate={minDate}
          />
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShow(false)}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...FONTS.medium,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
  },
  inputText: {
    fontSize: 14,
    color: COLORS.black,
  },
  placeholder: {
    fontSize: 14,
    color: COLORS.gray,
  },
  doneBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  doneBtnText: {
    color: COLORS.primary,
    ...FONTS.bold,
  },
});
