import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Fonts } from '@/constants/theme';
import { cardsStore, type StoredCard } from '@/store/cardsStore';

export default function HomeScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<StoredCard[]>(() => cardsStore.getCards());

  useEffect(() => {
    cardsStore.subscribe(setCards);
  }, []);

  const totalCards = cards.length;
  const lastAdded = cards[cards.length - 1];
  const featuredCards = cards.slice(-2).reverse();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <MaterialIcons name="lock" size={16} color="#9EE0FF" />
          <Text style={styles.heroBadgeText}>Encrypted Vault</Text>
        </View>
        <Text style={styles.heroTitle}>Keep every card ready, secure, and synced.</Text>
        <Text style={styles.heroSubtitle}>
          Manage personal and business cards in one sleek wallet. Instant copy, biometric lock, and
          synced backups make checkout effortless.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.primaryCta} onPress={() => router.push('/card-editor')}>
            <MaterialIcons name="add" size={18} color="#050710" />
            <Text style={styles.primaryCtaText}>Add new card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={() => router.push('/(tabs)/cards')}
          >
            <Text style={styles.secondaryCtaText}>View vault</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="credit-card"
            label="Cards stored"
            value={`${totalCards}`}
            accent="#7B5CFF"
          />
          <StatCard
            icon="check-circle"
            label="Last added"
            value={lastAdded?.description ?? '—'}
            accent="#3DD598"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickActions}>
          <QuickActionCard
            icon="photo-camera"
            title="Scan card"
            description="Autofill digits with the camera"
          />
          <QuickActionCard
            icon="shield"
            title="Security report"
            description="Check the latest vault activity"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently added</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/cards')}>
            <Text style={styles.link}>See all</Text>
          </TouchableOpacity>
        </View>
        {featuredCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <Text style={styles.emptySubtitle}>Start by saving your first payment method.</Text>
          </View>
        ) : (
          featuredCards.map((card) => (
            <View key={card.id} style={styles.previewCard}>
              <Text style={styles.previewTitle}>{card.description}</Text>
              <Text style={styles.previewMeta}>
                {card.brand} • {card.cardholder}
              </Text>
              <Text style={styles.previewNumber}>
                **** **** **** {card.number.slice(-4)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

type StatCardProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  accent: string;
};

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${accent}33` }]}>
        <MaterialIcons name={icon} size={20} color={accent} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

type QuickActionProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
};

function QuickActionCard({ icon, title, description }: QuickActionProps) {
  return (
    <View style={styles.quickCard}>
      <View style={styles.quickIconWrapper}>
        <MaterialIcons name={icon} size={22} color="#C6D2FF" />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050710',
    marginTop: 50
  },
  container: {
    padding: 24,
    paddingBottom: 60,
    gap: 24,
  },
  hero: {
    backgroundColor: '#0F1324',
    borderRadius: 26,
    padding: 24,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(79, 190, 255, 0.12)',
    gap: 6,
  },
  heroBadgeText: {
    color: '#9EE0FF',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30,
    color: '#fff',
    fontFamily: Fonts.rounded,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#A5F276',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryCtaText: {
    fontWeight: '700',
    color: '#050710',
  },
  secondaryCta: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryCtaText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: Fonts.rounded,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0B0F1E',
    borderRadius: 20,
    padding: 18,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#0F1324',
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  quickDescription: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  link: {
    color: '#8CD1FF',
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#10152A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  previewTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewMeta: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  previewNumber: {
    marginTop: 12,
    fontSize: 18,
    letterSpacing: 2,
    color: '#fff',
    fontFamily: Fonts.mono,
  },
  emptyState: {
    backgroundColor: '#0B0F1E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    textAlign: 'center',
  },
});
