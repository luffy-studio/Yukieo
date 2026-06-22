import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type Props = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
};

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  showChevron = true,
}: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: destructive ? colors.destructive + "20" : colors.coral + "20" },
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color={destructive ? colors.destructive : colors.coral}
        />
      </View>
      <Text
        style={[
          styles.label,
          { color: destructive ? colors.destructive : colors.ivory },
        ]}
      >
        {label}
      </Text>
      <View style={styles.right}>
        {value ? (
          <Text style={[styles.value, { color: colors.mutedForeground }]}>
            {value}
          </Text>
        ) : null}
        {showChevron && onPress && (
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
