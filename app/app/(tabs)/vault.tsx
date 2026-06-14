import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/lib/api';

interface Document {
  id: string;
  document_type: 'passport' | 'visa' | 'insurance' | 'vaccine' | 'other';
  name: string;
  file_url: string;
  expires_at: string | null;
}

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  passport: 'book',
  visa: 'document-text',
  insurance: 'shield-checkmark',
  vaccine: 'medkit',
  other: 'folder',
};

function getExpiryStatus(expiresAt: string | null): 'valid' | 'soon' | 'expired' {
  if (!expiresAt) return 'valid';
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'expired';
  if (days < 30) return 'soon';
  return 'valid';
}

export default function VaultScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data.documents || []);
    } catch (err: any) {
      console.error('Fetch documents error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const renderDocument = ({ item }: { item: Document }) => {
    const expiry = getExpiryStatus(item.expires_at);
    return (
      <TouchableOpacity
        style={styles.docCard}
        onPress={() => setSelectedDoc(item === selectedDoc ? null : item)}
      >
        <View style={styles.docIcon}>
          <Ionicons
            name={TYPE_ICONS[item.document_type] || 'folder'}
            size={24}
            color="#0D6B6B"
          />
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docName}>{item.name}</Text>
          <Text style={styles.docType}>
            {item.document_type.charAt(0).toUpperCase() + item.document_type.slice(1)}
          </Text>
          {item.expires_at && (
            <Text style={styles.docExpiry}>
              Expires: {new Date(item.expires_at).toLocaleDateString()}
            </Text>
          )}
        </View>
        <View style={[
          styles.statusDot,
          expiry === 'expired' && styles.statusExpired,
          expiry === 'soon' && styles.statusSoon,
          expiry === 'valid' && styles.statusValid,
        ]} />
        <Ionicons name={selectedDoc?.id === item.id ? 'lock-open' : 'lock-closed'} size={18} color="#CCC" />
      </TouchableOpacity>
    );
  };

  // Group documents by type
  const globalDocs = documents.filter((d) =>
    ['passport', 'visa', 'insurance'].includes(d.document_type)
  );
  const otherDocs = documents.filter((d) =>
    !['passport', 'visa', 'insurance'].includes(d.document_type)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Document Vault</Text>
        <Text style={styles.headerSubtitle}>
          Your documents are encrypted and stored securely
        </Text>
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={renderDocument}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDocuments} tintColor="#0D6B6B" />
        }
        ListHeaderComponent={
          <>
            {globalDocs.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Essential Documents</Text>
                {/* Already rendered via FlatList data */}
              </>
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="lock-closed" size={48} color="#CCC" />
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptyDesc}>
                Upload passports, visas, insurance cards & more for quick access
              </Text>
            </View>
          ) : null
        }
      />

      {/* Upload FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert('Upload', 'Document upload would open picker here')}
      >
        <Ionicons name="cloud-upload" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#222',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 12,
  },
  docCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 8,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  docType: {
    fontSize: 13,
    color: '#999',
    textTransform: 'capitalize',
  },
  docExpiry: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusValid: {
    backgroundColor: '#4CAF50',
  },
  statusSoon: {
    backgroundColor: '#F5A623',
  },
  statusExpired: {
    backgroundColor: '#F44336',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
