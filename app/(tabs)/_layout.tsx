import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Home, Search, User, PlusCircle, Heart } from "lucide-react-native";
import { colors } from "@/constants/theme";
import GradientTabBar from "@/components/ui/GradientTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GradientTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Akış",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: "Eşleş",
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Keşfet",
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="new-post-tab"
        options={{
          title: "",
          tabBarIcon: () => <PlusCircle size={28} color={colors.white} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("new-post");
          },
        })}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
