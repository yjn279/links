/**
 * AddBookmarkModal.tsx — Liquid Glass modal for adding bookmarks
 * Mirrors design-spec/ui_kits/links-app/AddBookmarkModal.jsx + styles.css .modal-*
 * Props: { open, onClose, onSave, defaultUrl?, existingTags }
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { GlassSurface } from './GlassSurface';
import { Icon } from './Icon';
import { TagChipEditor } from './TagChipEditor';
import { color, radius, sp, typeScale } from '../src/theme/tokens';
import { normalizeUrl } from '../src/bookmarks/url';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (url: string, tagNames: string[]) => void;
  defaultUrl?: string;
  existingTags: string[];
};

export function AddBookmarkModal({ open, onClose, onSave, defaultUrl, existingTags }: Props) {
  const [url, setUrl] = useState(defaultUrl ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.96)).current;
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(open);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultUrl) setUrl(defaultUrl);
  }, [defaultUrl]);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
    Animated.parallel([
      Animated.timing(scrimOpacity, {
        toValue: open ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: open ? 1 : 0.96,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!open) setVisible(false);
    });
  }, [open, scrimOpacity, modalScale]);

  const handleSave = () => {
    const result = normalizeUrl(url);
    if (!result.ok) {
      setUrlError(result.error);
      return;
    }
    setUrlError(null);
    onSave(result.url, selectedTags);
    setUrl('');
    setSelectedTags([]);
  };

  const isReady = url.trim().length > 0;

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
      pointerEvents={open ? 'auto' : 'none'}
    >
      {/* Scrim */}
      <TouchableWithoutFeedback onPress={onClose} accessible={false}>
        <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Modal */}
      <Animated.View style={[styles.modalWrapper, { transform: [{ scale: modalScale }] }]}>
        <GlassSurface tint="strong" borderRadius={radius['2xl']} style={styles.modal}>
          {/* Close button */}
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Close"
          >
            <Icon name="x" size={18} color={color.ink3} />
          </Pressable>

          {/* Mark */}
          <View style={styles.mark}>
            <Icon name="link" size={26} color={color.ink} />
          </View>

          <Text style={styles.title}>Add Bookmark</Text>
          <Text style={styles.sub}>AI will automatically analyze and tag your link</Text>

          {/* URL input */}
          <View style={[styles.field, focused && styles.fieldFocused]}>
            <Icon name="link" size={16} color={color.ink3} />
            <TextInput
              ref={inputRef}
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                if (urlError) setUrlError(null);
              }}
              placeholder="https://…"
              placeholderTextColor={color.ink4}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleSave}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>
          {urlError ? (
            <Text
              style={styles.errorText}
              accessibilityLabel={urlError}
              accessibilityRole="alert"
            >
              {urlError}
            </Text>
          ) : null}

          {/* Tag selector */}
          <View style={styles.tagSection}>
            <TagChipEditor
              existingTags={existingTags}
              selected={selectedTags}
              onChange={setSelectedTags}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnCancel]}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!isReady}
              style={[styles.btn, styles.btnSave, isReady && styles.btnSaveReady]}
            >
              <Text style={[styles.btnSaveText, !isReady && styles.btnSaveTextDim]}>Save</Text>
            </Pressable>
          </View>
        </GlassSurface>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(31,26,20,0.20)',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }
      : {}),
  },
  modalWrapper: {
    width: '92%',
    maxWidth: 420,
    zIndex: 1,
  },
  modal: {
    padding: 22,
    paddingBottom: 18,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: color.amber,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: sp[1],
    marginBottom: 14,
  },
  title: {
    ...typeScale.h2,
    fontSize: 24,
    color: color.ink,
    textAlign: 'center',
  },
  sub: {
    ...typeScale.bodySm,
    color: color.ink2,
    textAlign: 'center',
    marginTop: 4,
  },
  field: {
    backgroundColor: color.paper2,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    ...typeScale.bodySm,
    color: color.catDesign,
    marginBottom: 12,
  },
  fieldFocused: {
    shadowColor: color.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    ...typeScale.body,
    color: color.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as object : {}),
  },
  tagSection: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  btnCancelText: {
    ...typeScale.button,
    color: color.ink,
  },
  btnSave: {
    backgroundColor: '#FFE079',
    opacity: 0.6,
  },
  btnSaveReady: {
    backgroundColor: color.amber,
    opacity: 1,
  },
  btnSaveText: {
    ...typeScale.button,
    color: color.ink,
  },
  btnSaveTextDim: {
    opacity: 0.7,
  },
});
