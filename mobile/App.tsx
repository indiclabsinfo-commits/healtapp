import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { useAuthStore } from './src/store/auth';
import { colors } from './src/theme/colors';
import { registerForPushNotifications, addNotificationResponseListener } from './src/config/notifications';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OrgCodeScreen from './src/screens/OrgCodeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import CounsellorDetailScreen from './src/screens/CounsellorDetailScreen';
import BreathingScreen from './src/screens/BreathingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AssessmentScreen from './src/screens/AssessmentScreen';
import TheoryScreen from './src/screens/TheoryScreen';
import BookingScreen from './src/screens/BookingScreen';
import SessionsScreen from './src/screens/SessionsScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AssessmentHistoryScreen from './src/screens/AssessmentHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Navigation ref — used to navigate from outside React tree (e.g. push notifications)
export const navigationRef = createNavigationContainerRef<any>();

// ----- Navigators -----

const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
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
      <HomeStack.Screen name="Breathe" component={BreathingScreen} />
      <HomeStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen name="AssessmentHistory" component={AssessmentHistoryScreen} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
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

function ExploreStackNavigator() {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'slide_from_right',
      }}
    >
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStack.Screen name="CounsellorDetail" component={CounsellorDetailScreen} />
    </ExploreStack.Navigator>
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
            case 'Home':       iconName = focused ? 'home' : 'home-outline'; break;
            case 'Explore':    iconName = focused ? 'compass' : 'compass-outline'; break;
            case 'Book':       iconName = focused ? 'calendar' : 'calendar-outline'; break;
            case 'Analytics':  iconName = focused ? 'bar-chart' : 'bar-chart-outline'; break;
            case 'Profile':    iconName = focused ? 'person' : 'person-outline'; break;
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Home" component={HomeStackNavigator} />
      <MainTab.Screen name="Explore" component={ExploreStackNavigator} />
      <MainTab.Screen name="Book" component={BookStackNavigator} />
      <MainTab.Screen name="Analytics" component={AnalyticsScreen} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
}

// ----- Root App -----

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loadTokens = useAuthStore((s) => s.loadTokens);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    loadTokens();
    SecureStore.getItemAsync('onboardingDone').then((v) => setShowOnboarding(!v));
  }, [loadTokens]);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications();
      const sub = addNotificationResponseListener((response) => {
        // Notification payload may contain qid (for assignment) or sessionId (for consultation).
        // Avoid logging the full payload — may contain PII (counsellor name, session details).
        const data = response.notification.request.content.data as any;
        if (!navigationRef.isReady()) return;
        if (data?.qid) {
          // Assignment push → open the quiz directly
          navigationRef.navigate('Home', { screen: 'Assessment', params: { qid: data.qid } });
        } else if (data?.sessionId || data?.type === 'consultation') {
          navigationRef.navigate('Book', { screen: 'SessionsList' });
        } else if (data?.type === 'notification') {
          navigationRef.navigate('Home', { screen: 'Notifications' });
        }
      });
      return () => sub.remove();
    }
  }, [isAuthenticated]);

  if (isLoading || showOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
        <StatusBar style="light" />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onDone={() => setShowOnboarding(false)} />
      </>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
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
