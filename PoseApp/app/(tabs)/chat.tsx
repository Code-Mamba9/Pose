import { generateAPIUrl } from '@/utils';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInRight,
  FadeInLeft,
  SlideInDown,
  withSpring,
  useSharedValue,
  useAnimatedStyle
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function Chat() {
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputScale = useSharedValue(1);

  // Safe area insets for proper positioning
  const insets = useSafeAreaInsets();

  const { messages, error, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl('/api/chat'),
    }),
    onError: error => console.error(error, 'ERROR'),
  });

  // Theme colors - All hooks must be called at top level
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'text');
  const textColor = useThemeColor({}, 'text');
  const assistantBubbleColor = useThemeColor({ light: '#F3F4F6', dark: '#374151' }, 'background');
  const inputBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1F2937' }, 'background');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Input animation style
  const inputAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: inputScale.value }],
    };
  });

  const handleSendMessage = () => {
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
      inputScale.value = withSpring(0.95, { duration: 100 }, () => {
        inputScale.value = withSpring(1, { duration: 150 });
      });
    }
  };

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText type="title" style={styles.errorText}>
          Connection Error
        </ThemedText>
        <ThemedText style={styles.errorSubtext}>
          {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: borderColor }]}>
        <ThemedText type="title" style={styles.headerTitle}>
          AI Posture Assistant
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Get personalized guidance for your recovery
        </ThemedText>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <Animated.View entering={FadeInUp.delay(300)} style={styles.welcomeContainer}>
              <ThemedText type="subtitle" style={styles.welcomeTitle}>
                Welcome! 👋
              </ThemedText>
              <ThemedText style={styles.welcomeText}>
                I'm your orthopedic AI assistant. Share your posture concerns or ask about your recovery progress.
              </ThemedText>
            </Animated.View>
          )}

          {messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={message.role === 'user' ? FadeInRight.delay(100) : FadeInLeft.delay(200)}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                {
                  backgroundColor: message.role === 'user'
                    ? tintColor
                    : assistantBubbleColor
                }
              ]}
            >
              <View style={styles.messageContent}>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <ThemedText
                          key={`${message.id}-${i}`}
                          style={[
                            styles.messageText,
                            message.role === 'user' && styles.userMessageText
                          ]}
                        >
                          {part.text}
                        </ThemedText>
                      );
                    default:
                      return null;
                  }
                })}
              </View>
              {message.role === 'assistant' && (
                <View style={styles.assistantIndicator}>
                  <ThemedText style={[styles.assistantLabel, { color: iconColor }]}>
                    AI Doctor
                  </ThemedText>
                </View>
              )}
            </Animated.View>
          ))}

          {/* Loading indicator */}
          {(status === 'submitted' || status === 'streaming') && (
            <Animated.View
              entering={FadeInLeft}
              style={[
                styles.messageBubble,
                styles.assistantMessage,
                styles.loadingMessage,
                {
                  backgroundColor: assistantBubbleColor
                }
              ]}
            >
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color={iconColor} />
                <ThemedText style={[styles.loadingText, { color: iconColor }]}>
                  AI is thinking...
                </ThemedText>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[
          styles.inputContainer,
          {
            borderTopColor: borderColor,
            paddingBottom: insets.bottom + 70
          }
        ]}>
          <Animated.View
            style={[inputAnimatedStyle]}
            entering={SlideInDown.delay(400)}
          >
            <View style={[styles.inputWrapper, { borderColor }]}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: textColor,
                    backgroundColor: inputBackgroundColor
                  }
                ]}
                placeholder="Ask about your posture or recovery..."
                placeholderTextColor={iconColor}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSendMessage}
                multiline
                maxLength={500}
                editable={status !== 'submitted' && status !== 'streaming'}
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: input.trim() ? tintColor : iconColor,
                    opacity: input.trim() ? 1 : 0.5
                  }
                ]}
                onPress={handleSendMessage}
                disabled={!input.trim() || status === 'submitted' || status === 'streaming'}
              >
                <ThemedText style={styles.sendButtonText}>
                  {status === 'submitted' || status === 'streaming' ? '⋯' : '→'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  messageBubble: {
    marginVertical: 6,
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  loadingMessage: {
    paddingVertical: 12,
  },
  messageContent: {
    flexShrink: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantIndicator: {
    marginTop: 8,
  },
  assistantLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingVertical: 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    marginLeft: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
