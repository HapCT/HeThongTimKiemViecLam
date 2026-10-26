import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e2e8f0',
            borderTopWidth: 1,
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Việc làm',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 22 }}>💼</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Hồ sơ đã nộp',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 22 }}>📋</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="interviews"
          options={{
            title: 'Lịch hẹn',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 22 }}>📅</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Ứng viên',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 22 }}>👤</Text>
            ),
          }}
        />
      </Tabs>
    </AuthProvider>
  );
}
