import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

/**
 * PhotoPicker component for adding before/after service photos.
 * Props:
 *   photos    - array of { uri, label } objects
 *   onChange  - called with updated photos array
 *   maxPhotos - max number of photos (default 4)
 */
export default function PhotoPicker({ photos = [], onChange, maxPhotos = 4 }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const pickImage = async (source) => {
    try {
      const options = {
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      };

      let result;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Camera permission is needed to take photos");
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets?.[0]) {
        const newPhoto = {
          uri: result.assets[0].uri,
          label: photos.length === 0 ? "Before" : "After",
        };
        onChange([...photos, newPhoto]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removePhoto = (index) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const showOptions = () => {
    Alert.alert("Add Photo", "Choose source", [
      { text: "Camera", onPress: () => pickImage("camera") },
      { text: "Gallery", onPress: () => pickImage("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoCard}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <Text style={styles.photoLabel}>{photo.label}</Text>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removePhoto(index)}
            >
              <MaterialCommunityIcons
                name="close"
                size={14}
                color={colors.onPrimary}
              />
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < maxPhotos && (
          <TouchableOpacity style={styles.addBtn} onPress={showOptions}>
            <MaterialCommunityIcons
              name="camera-plus-outline"
              size={26}
              color={colors.primary}
            />
            <Text style={styles.addText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { marginTop: 8 },
    photoCard: {
      marginRight: 10,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: colors.grayLight,
    },
    photo: {
      width: 100,
      height: 100,
      borderRadius: 8,
    },
    photoLabel: {
      fontSize: 12,
      color: colors.text,
      textAlign: "center",
      paddingVertical: 4,
      fontWeight: "600",
    },
    removeBtn: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: colors.danger,
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    addBtn: {
      width: 100,
      height: 100,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card,
    },
    addText: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 4,
    },
  });
