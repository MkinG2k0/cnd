import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ErrorState } from "@/src/components/ErrorState";
import {
  buildQuizMessage,
  isCustomOption,
  whatsappURL,
} from "@/src/lib/whatsapp";
import { colors, fontFamily, spacing } from "@/src/theme/tokens";

export default function QuizScreen() {
  const router = useRouter();
  const { productName } = useLocalSearchParams<{ productName?: string }>();
  const { settings, loading, error: loadError, reload } = useSiteSettings();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([]);
  const [customs, setCustoms] = useState<string[]>([]);
  const [draftAnswers, setDraftAnswers] = useState<string[]>([]);
  const [draftCustom, setDraftCustom] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState("");

  const quiz = settings?.quiz ?? [];
  const isLast = step === quiz.length;
  const question = isLast ? null : quiz[step];
  const isMulti = step === 2;

  useEffect(() => {
    if (isLast) return;
    setDraftAnswers(answers[step] ?? []);
    setDraftCustom(customs[step] ?? "");
    setFormError("");
  }, [answers, customs, isLast, step]);

  function toggleAnswer(value: string) {
    setDraftAnswers((current) => {
      if (!isMulti) return [value];
      return current.includes(value)
        ? current.filter((answer) => answer !== value)
        : [...current, value];
    });
  }

  function goBack() {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((current) => current - 1);
  }

  async function continueQuiz() {
    if (!isLast) {
      if (draftAnswers.length === 0) {
        setFormError("Выберите подходящий вариант.");
        return;
      }
      if (draftAnswers.some(isCustomOption) && !draftCustom.trim()) {
        setFormError("Напишите свой вариант ответа.");
        return;
      }

      const nextAnswers = [...answers];
      const nextCustoms = [...customs];
      nextAnswers[step] = draftAnswers;
      nextCustoms[step] = draftCustom.trim();
      setAnswers(nextAnswers);
      setCustoms(nextCustoms);
      setStep((current) => current + 1);
      return;
    }

    if (!consent) {
      setFormError("Подтвердите передачу ответов в WhatsApp.");
      return;
    }
    if (contactPhone && !/^[+\d\s()\-]{7,25}$/.test(contactPhone)) {
      setFormError("Проверьте номер телефона.");
      return;
    }
    if (!settings?.contacts.whatsapp) {
      setFormError("Номер WhatsApp временно недоступен.");
      return;
    }

    const message = buildQuizMessage({
      quiz,
      answers,
      customs,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      productName,
    });

    try {
      await Linking.openURL(
        whatsappURL(settings.contacts.whatsapp, message),
      );
      router.back();
    } catch {
      setFormError("Не удалось открыть WhatsApp.");
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} size="large" />
        <Text style={styles.statusText}>Загружаем анкету…</Text>
      </View>
    );
  }

  if (loadError || !settings) {
    return (
      <View style={styles.centered}>
        <ErrorState
          title="Не удалось загрузить анкету"
          subtitle="Проверьте подключение к интернету и попробуйте снова."
          onRetry={() => void reload()}
        />
      </View>
    );
  }

  const customSelected = draftAnswers.some(isCustomOption);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.kicker}>Индивидуальный подбор</Text>
        <Text style={styles.counter}>
          {step + 1} / {quiz.length + 1}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progress,
            { width: `${((step + 1) / (quiz.length + 1)) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.card}>
        {isLast ? (
          <>
            <Text style={styles.title}>Обсудим вашу квартиру</Text>
            <View style={styles.summary}>
              {quiz.map((item, index) => (
                <View key={`${item.title}-${index}`}>
                  <Text style={styles.summaryTitle}>{item.title}</Text>
                  <Text style={styles.summaryAnswer}>
                    {(answers[index] ?? [])
                      .map((value) =>
                        isCustomOption(value)
                          ? customs[index] || value
                          : value,
                      )
                      .join(", ")}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.label}>ФИО (необязательно)</Text>
            <TextInput
              autoComplete="name"
              maxLength={100}
              onChangeText={setContactName}
              style={styles.input}
              value={contactName}
            />
            <Text style={styles.label}>Номер телефона (необязательно)</Text>
            <TextInput
              autoComplete="tel"
              keyboardType="phone-pad"
              maxLength={25}
              onChangeText={setContactPhone}
              placeholder="+7"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={contactPhone}
            />
            <View style={styles.consent}>
              <Switch
                accessibilityLabel="Согласие на передачу данных через WhatsApp"
                onValueChange={setConsent}
                trackColor={{ false: colors.line, true: colors.forest }}
                value={consent}
              />
              <Text style={styles.consentText}>
                Я согласен передать введённые данные менеджеру через WhatsApp.
              </Text>
            </View>
            <Text style={styles.help}>
              Кнопка откроет WhatsApp с вашими ответами. Проверьте сообщение и
              отправьте его самостоятельно. До этого заявка не отправляется.
            </Text>
          </>
        ) : question ? (
          <>
            <Text style={styles.title}>{question.title}</Text>
            {isMulti ? (
              <Text style={styles.help}>
                Отметьте один или несколько вариантов
              </Text>
            ) : null}
            <View style={styles.options}>
              {question.options.map((value, index) => {
                const selected = draftAnswers.includes(value);
                return (
                  <Pressable
                    accessibilityRole={isMulti ? "checkbox" : "radio"}
                    accessibilityState={{ checked: selected }}
                    key={`${value}-${index}`}
                    onPress={() => toggleAnswer(value)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}>
                    <View
                      style={[
                        isMulti ? styles.checkbox : styles.radio,
                        selected && styles.markSelected,
                      ]}>
                      {selected ? <View style={styles.markInner} /> : null}
                    </View>
                    <Text style={styles.optionText}>{value}</Text>
                    {question.images[index] ? (
                      <Image
                        source={{ uri: question.images[index] }}
                        style={styles.optionImage}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            {customSelected ? (
              <TextInput
                accessibilityLabel="Свой вариант ответа"
                maxLength={200}
                onChangeText={setDraftCustom}
                placeholder="Свой вариант ответа"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={draftCustom}
              />
            ) : null}
          </>
        ) : null}

        {formError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {formError}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Назад
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void continueQuiz()}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.buttonText}>
              {isLast ? "Открыть WhatsApp ↗" : "Далее ↗"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.founderBg,
    flex: 1,
  },
  centered: {
    alignItems: "center",
    backgroundColor: colors.pale,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  statusText: {
    color: colors.muted,
    fontSize: 15,
    marginTop: spacing.md,
  },
  content: {
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  kicker: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
  },
  counter: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    backgroundColor: colors.line,
    borderRadius: 2,
    height: 4,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  progress: {
    backgroundColor: colors.forest,
    height: "100%",
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    padding: 18,
  },
  title: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: "500",
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  help: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    alignItems: "center",
    backgroundColor: colors.pale,
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionSelected: {
    backgroundColor: "#e1eadf",
    borderColor: colors.forest,
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.muted,
    borderRadius: 3,
    borderWidth: 1.5,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  radio: {
    alignItems: "center",
    borderColor: colors.muted,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  markSelected: {
    borderColor: colors.forest,
  },
  markInner: {
    backgroundColor: colors.forest,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  optionText: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
  },
  optionImage: {
    borderRadius: 6,
    height: 58,
    width: 74,
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: -spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  summary: {
    backgroundColor: colors.pale,
    borderRadius: 8,
    gap: spacing.sm,
    padding: spacing.md,
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryAnswer: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  consent: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  consentText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.forest,
    borderColor: colors.forest,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.forest,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonTextSecondary: {
    color: colors.forest,
  },
  pressed: {
    opacity: 0.8,
  },
});
