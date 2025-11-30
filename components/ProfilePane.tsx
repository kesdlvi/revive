import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfilePaneProps {
  scale: Animated.Value;
  profileData: { username?: string } | null;
  userEmail?: string;
  userCreatedAt?: string;
  activeProfileTab: 'Created' | 'Saved';
  onProfileTabChange: (tab: 'Created' | 'Saved') => void;
  onSignOut: () => void;
}

export function ProfilePane({
  scale,
  profileData,
  userEmail,
  userCreatedAt,
  activeProfileTab,
  onProfileTabChange,
  onSignOut,
}: ProfilePaneProps) {
  return (
    <Animated.View style={[styles.pane, { transform: [{ scale }] }]}>
      <View style={styles.profileContainer}>
        {/* Edit Button */}
        <View style={styles.profileTopBar}>
          <View style={{ width: 44 }} />
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
    
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.profileContent}>
          <View style={styles.profileAvatarContainer}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={60} color="#666" />
            </View>
            <Text style={styles.profileName}>
              {profileData?.username ? `@${profileData.username}` : userEmail}
            </Text>
            {userCreatedAt && (
              <Text style={styles.profileMemberSince}>
                Member since {new Date(userCreatedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
          <View style={styles.profileSection}>
            <TouchableOpacity 
              style={styles.profileTab}
              onPress={() => onProfileTabChange('Created')}
            >
              <Text style={[styles.sectionTitle, activeProfileTab === 'Created' && styles.activeSectionTitle]}>
                Created
              </Text>
              {activeProfileTab === 'Created' && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileTab}
              onPress={() => onProfileTabChange('Saved')}
            >
              <Text style={[styles.sectionTitle, activeProfileTab === 'Saved' && styles.activeSectionTitle]}>
                Saved
              </Text>
              {activeProfileTab === 'Saved' && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          </View>
          <Text style={styles.emptyText}>No posts yet</Text>
          
          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pane: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  profileTopBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  editButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContent: {
    padding: 20,
    paddingTop: 120,
  },
  profileAvatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  profileMemberSince: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  profileTab: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  activeSectionTitle: {
    color: '#FFF',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  signOutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
});

