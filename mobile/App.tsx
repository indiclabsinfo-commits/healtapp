import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from './src/store/auth';
import { colors } from './src/theme/colors';
import { registerForPushNotifications, addNotificationResponseListener } from './src/config/notifications';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OrgCodeScreen from './src/screens/OrgCodeScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import BreathingScreen from './src/screens/BreathingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AssessmentScreen from './src/screens/AssessmentScreen';
import TheoryScreen from './src/screens/TheoryScreen';
import BookingScreen from './src/screens/BookingScreen';
import SessionsScreen from './src/screens/SessionsScreen';

// ----- Navigators -----

const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const BookStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="OrgCode" component={OrgCodeScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'slide_from_right',
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Assessment" component={AssessmentScreen} />
      <HomeStack.Screen name="Theory" component={TheoryScreen} />
    </HomeStack.Navigator>
  );
}

function BookStackNavigator() {
  return (
    <BookStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'slide_from_right',
      }}
    >
      <BookStack.Screen name="BookingMain" component={BookingScreen} />
      <BookStack.Screen name="SessionsList" component={SessionsScreen} />
    </BookStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.navBg,
          borderTopColor: colors.borderCard,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accentPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500' as const,
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Explore':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Book':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Breathe':
              iconName = focused ? 'leaf' : 'leaf-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Home" component={HomeStackNavigator} />
      <MainTab.Screen name="Explore" component={ExploreScreen} />
      <MainTab.Screen name="Book" component={BookStackNavigator} />
      <MainTab.Screen name="Breathe" component={BreathingScreen} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
}

// ----- Root App -----

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loadTokens = useAuthStore((s) => s.loadTokens);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  // Register push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications();
      const sub = addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data;
        // Handle notification tap — navigate based on type
        console.log('Notification tapped:', data);
      });
      return () => sub.remove();
    }
  }, [isAuthenticated]);

  // Show loading screen while checking stored tokens
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
