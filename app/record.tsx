import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/Button';
import { HighlightedTranscript } from '@/components/HighlightedTranscript';
import { TourAnchor, TourScrollView } from '@/components/TourGuide';
import { useSpeechCapture } from '@/hooks/useSpeechCapture';
import { analyzeSpeech, previewSpeech } from '@/lib/analysis';
import { getTodaysPrompt } from '@/lib/prompts';
import { SAMPLE_ANSWERS } from '@/lib/samples';
import { estimateDurationFromWords, MAX_SPEAK_SECONDS } from '@/lib/speech';
import { restoreTranscript } from '@/lib/transcript';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const active = useCadenceStore((s) => s.activePractice);
  const lastPrompt = useCadenceStore((s) => s.lastPrompt);
  const profile = useCadenceStore((s) => s.profile);
  const startPractice = useCadenceStore((s) => s.startPractice);
  const setLastResult = useCadenceStore((s) => s.setLastResult);
  const completeTourStep = useCadenceStore((s) => s.completeTourStep);
  const quietTour = useCadenceStore((s) => s.quietTour);
  const tourComplete = useCadenceStore((s) => s.tourComplete);
  const enemyWord = profile.enemyWord;

  const [showSamples, setShowSamples] = useState(false);
  const [manualEdit, setManualEdit] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const analyzingRef = useRef(false);
  const capturedRef = useRef(false);

  useEffect(() => {
    if (active) return;
    if (!tourComplete) {
      router.replace('/(tabs)');
      return;
    }
    const fallback = lastPrompt ?? {
      promptId: getTodaysPrompt(profile.goal).id,
      promptText: getTodaysPrompt(profile.goal).text,
      category: getTodaysPrompt(profile.goal).category,
      prepMinutes: 0 as const,
    };
    startPractice(fallback);
  }, [active, lastPrompt, profile.goal, router, startPractice, tourComplete]);

  const promptText = active?.promptText ?? lastPrompt?.promptText ?? 'Speak your answer';

  const goToResults = (
    text: string,
    durationSec: number,
    pauses?: number,
    paceSeries?: { t: number; words: number; wpm: number }[]
  ) => {
    if (!tourComplete && !capturedRef.current) return;
    const cleaned = restoreTranscript(text.trim());
    if (!cleaned || analyzingRef.current) return;
    analyzingRef.current = true;
    setAnalyzing(true);
    const analysis = analyzeSpeech(cleaned, Math.max(durationSec, 1), {
      pauseCount: pauses,
      paceSeries,
    });
    setLastResult(cleaned, analysis);
    completeTourStep('record-mic');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    router.replace('/results');
  };

  const cap = active?.maxSeconds ?? lastPrompt?.maxSeconds ?? MAX_SPEAK_SECONDS;
  const speech = useSpeechCapture({
    maxSeconds: cap,
    onAutoStop: ({ transcript, elapsed, pauses, paceSeries }) => {
      if (previewSpeech(transcript).wordCount >= 8) {
        goToResults(transcript, elapsed, pauses, paceSeries);
      }
    },
  });

  const liveText = manualEdit ? speech.finalText : speech.transcript || speech.finalText;
  const preview = useMemo(() => previewSpeech(liveText), [liveText]);
  const liveWpm =
    speech.elapsed > 0 ? Math.round((preview.wordCount / speech.elapsed) * 60) : preview.wordCount;

  const listening = speech.status === 'listening';
  const countingDown = speech.status === 'countdown';

  const startCapture = () => {
    quietTour();
    capturedRef.current = true;
    setCaptured(true);
    setManualEdit(false);
    speech.startWithCountdown();
  };

  const stopAndAnalyze = () => {
    const result = speech.stop();
    const text = (result.transcript || liveText).trim();
    if (previewSpeech(text).wordCount >= 6) {
      goToResults(text, result.elapsed || speech.elapsed, result.pauses, result.paceSeries);
      return;
    }
    if (!tourComplete) return;
    setManualEdit(true);
  };

  const analyzeCurrent = () => {
    if (!captured) return;
    const text = liveText.trim();
    if (!text) return;
    const duration =
      speech.elapsed >= 3 ? speech.elapsed : estimateDurationFromWords(preview.wordCount);
    goToResults(text, duration, speech.pauses, speech.paceSeries);
  };

  const useSample = (id: string) => {
    if (!tourComplete) return;
    const sample = SAMPLE_ANSWERS.find((s) => s.id === id);
    if (!sample) return;
    speech.stop();
    capturedRef.current = true;
    setCaptured(true);
    speech.setTranscriptOverride(sample.transcript);
    setManualEdit(true);
    setShowSamples(false);
    goToResults(sample.transcript, sample.durationSec);
  };

  const mm = Math.floor(speech.elapsed / 60);
  const ss = (speech.elapsed % 60).toString().padStart(2, '0');
  const remaining = Math.max(0, cap - speech.elapsed);

  const clockLabel = countingDown
    ? 'Get ready'
    : listening
      ? `${mm}:${ss}`
      : 'Press to start';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 12 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        {tourComplete ? (
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              speech.stop();
              router.back();
            }}
            hitSlop={12}
          >
            <Text style={styles.back}>← Back</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Text style={styles.cap}>{remaining}s left</Text>
      </View>

      <TourScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <Text style={styles.prompt}>{promptText}</Text>

        {enemyWord ? (
          <Text style={styles.enemy}>
            Enemy word: <Text style={styles.enemyWord}>{enemyWord}</Text>
            {preview.fillersFound.some((f) => f.word === enemyWord.toLowerCase())
              ? ' · caught live'
              : ''}
          </Text>
        ) : null}

        {active?.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Your prep notes</Text>
            <Text style={styles.notesText}>{active.notes}</Text>
          </View>
        ) : null}

        <View style={styles.recArea}>
          <Text style={[styles.clock, !listening && !countingDown && styles.clockIdle]}>
            {clockLabel}
          </Text>

          <TourAnchor id="record-mic">
          <Pressable
            onPress={() => {
              if (listening || countingDown) {
                stopAndAnalyze();
              } else {
                startCapture();
              }
            }}
            style={[
              styles.micBtn,
              listening && styles.micBtnHot,
              countingDown && styles.micBtnWait,
            ]}
          >
            <Text style={styles.micGlyph}>{listening ? '■' : countingDown ? speech.countdown : '●'}</Text>
          </Pressable>
          </TourAnchor>

          <Text style={styles.recStatus}>
            {analyzing
              ? 'Analyzing…'
              : countingDown
                ? 'Get ready'
                : listening
                  ? 'Listening — just speak'
                  : speech.status === 'denied'
                    ? tourComplete
                      ? 'Mic blocked — allow it, or use a demo'
                      : 'Mic blocked — allow it in Settings, then tap the circle'
                    : speech.status === 'unsupported'
                      ? tourComplete
                        ? 'Live speech needs Chrome / Edge / Safari'
                        : 'Allow the microphone, then tap the circle'
                      : 'Tap the mic and speak'}
          </Text>

          {speech.errorMessage && !listening ? (
            <Text style={styles.error}>{speech.errorMessage}</Text>
          ) : null}
        </View>

        <View style={styles.liveStats}>
          <LiveStat label="Words" value={preview.wordCount} />
          <LiveStat label="Fillers" value={preview.fillerCount} warn={preview.fillerCount > 0} />
          <LiveStat label="WPM" value={speech.elapsed > 0 ? liveWpm : '—'} />
          <LiveStat label="Pauses" value={speech.pauses} />
        </View>

        {listening || countingDown ? (
          <Button
            label="Stop"
            variant="copper"
            onPress={stopAndAnalyze}
            style={{ marginBottom: 16 }}
          />
        ) : tourComplete ? (
          <Button
            label={speech.supported ? 'Start speaking' : 'Speech unavailable — use a demo'}
            onPress={() => {
              if (!speech.supported) {
                setShowSamples(true);
                return;
              }
              startCapture();
            }}
            style={{ marginBottom: 12 }}
          />
        ) : null}

        {tourComplete ? (
          <Pressable onPress={() => setShowSamples((s) => !s)}>
            <Text style={styles.demoLink}>
                {showSamples ? 'Hide demos' : 'No mic? Demo'}
            </Text>
          </Pressable>
        ) : null}

        {tourComplete && showSamples && (
          <View style={styles.samples}>
            {SAMPLE_ANSWERS.map((s) => (
              <Pressable key={s.id} style={styles.sampleCard} onPress={() => useSample(s.id)}>
                <Text style={styles.sampleLabel}>{s.label}</Text>
                <Text style={styles.sampleDesc}>{s.description}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {tourComplete || captured ? (
          <>
            <Text style={styles.editLabel}>Live transcript</Text>
            <Text style={styles.editHint}>
                {listening
                ? 'Fillers highlight as you talk.'
                : 'Fix anything that’s off, then analyze.'}
            </Text>

            {listening && !manualEdit ? (
              <View style={styles.transcriptBox}>
                {liveText ? (
                  <HighlightedTranscript
                    transcript={liveText}
                    fillerPositions={preview.fillerPositions}
                  />
                ) : (
                  <Text style={styles.placeholder}>Waiting for your voice…</Text>
                )}
              </View>
            ) : (
              <TextInput
                style={styles.transcriptInput}
                multiline
                value={liveText}
                editable={tourComplete}
                onChangeText={(t) => {
                  if (!tourComplete) return;
                  setManualEdit(true);
                  speech.setTranscriptOverride(t);
                }}
                placeholder="Your words appear here…"
                placeholderTextColor={colors.mutedLight}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            )}

            {tourComplete ? (
              <Button
                label={analyzing ? 'Analyzing…' : 'Analyze'}
                onPress={analyzeCurrent}
                disabled={!captured || !liveText.trim() || analyzing}
                loading={analyzing}
                style={{ marginTop: 8, marginBottom: 28 }}
              />
            ) : null}
          </>
        ) : null}
      </TourScrollView>
    </KeyboardAvoidingView>
  );
}

function LiveStat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, warn && { color: colors.coral }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.parchment,
    paddingHorizontal: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  back: { fontFamily: fonts.bodyMedium, color: colors.muted, fontSize: 15 },
  cap: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  prompt: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 30,
    color: colors.ink,
    marginBottom: 10,
  },
  enemy: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
  },
  enemyWord: {
    fontFamily: fonts.bodyBold,
    color: colors.coral,
  },
  notesBox: {
    backgroundColor: colors.upgradeHighlight,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.tealMid,
    marginBottom: 4,
  },
  notesText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  recArea: {
    alignItems: 'center',
    marginBottom: 18,
    paddingVertical: 8,
  },
  clock: {
    fontFamily: fonts.displayBold,
    fontSize: 48,
    color: colors.teal,
    marginBottom: 14,
  },
  clockIdle: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 16,
  },
  micBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  micBtnHot: {
    backgroundColor: colors.coral,
    transform: [{ scale: 1.06 }],
  },
  micBtnWait: {
    backgroundColor: colors.copper,
  },
  micGlyph: {
    color: colors.cream,
    fontSize: 28,
    fontFamily: fonts.displayBold,
  },
  recStatus: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  error: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.coral,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  liveStats: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 12,
    marginBottom: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.teal,
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 2,
  },
  demoLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.tealMid,
    textAlign: 'center',
    marginBottom: 16,
  },
  samples: { gap: 10, marginBottom: 20 },
  sampleCard: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sampleLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 4,
  },
  sampleDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },
  editLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 6,
  },
  editHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mutedLight,
    marginBottom: 10,
    lineHeight: 18,
  },
  transcriptBox: {
    minHeight: 140,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 4,
  },
  placeholder: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.mutedLight,
    fontStyle: 'italic',
  },
  transcriptInput: {
    minHeight: 140,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.ink,
  },
});
