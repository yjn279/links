import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AddBookmarkModal } from '../../components/AddBookmarkModal';
import { useAuth } from '../../src/auth/use-auth';
import { useBookmarksStore } from '../../src/bookmarks/store';
import { color } from '../../src/theme/tokens';

export default function AddBookmarkScreen() {
  const { session } = useAuth();
  const add = useBookmarksStore((s) => s.add);
  const params = useLocalSearchParams<{ url?: string }>();
  const [defaultUrl, setDefaultUrl] = useState(params.url ?? '');

  // Update URL field if share-intent injects a url param after mount
  useEffect(() => {
    if (params.url) {
      setDefaultUrl(params.url);
    }
  }, [params.url]);

  // When opened via the iOS share extension the navigation stack only
  // contains /(app)/add, so router.back() throws GO_BACK_unhandled. Fall
  // back to replacing with the bookmark list.
  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)');
    }
  };

  const onSave = async (url: string) => {
    if (!session) {
      dismiss();
      return;
    }
    try {
      await add(url, session.user.id);
    } catch {
      // error is surfaced via store.lastMetaError; dismiss anyway
    }
    dismiss();
  };

  return (
    <View style={styles.container}>
      <AddBookmarkModal
        open
        onClose={dismiss}
        onSave={onSave}
        defaultUrl={defaultUrl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.paper,
  },
});
