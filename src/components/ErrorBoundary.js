import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { COLORS, FONTS, SIZES } from "../constants/theme";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info?.componentStack);
    // TODO: wire to Sentry/Bugsnag here when reporting is added.
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app hit an unexpected error. You can try again, or restart the
            app if the problem keeps happening.
          </Text>
          {__DEV__ && this.state.error?.message ? (
            <Text style={styles.debug}>{String(this.state.error.message)}</Text>
          ) : null}
          <TouchableOpacity style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SIZES.padding * 1.5,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.danger,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    ...FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 20,
  },
  debug: {
    ...FONTS.small,
    color: COLORS.danger,
    backgroundColor: COLORS.danger + "10",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignSelf: "center",
  },
  buttonText: { color: COLORS.white, ...FONTS.bold },
});
