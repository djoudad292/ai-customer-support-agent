import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { Colors } from '@/lib/theme'
import { StackHeader } from '@/components/stack-header'

interface ChatMetadata {
  type: string
  title?: string
  options: { label: string; value: string }[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  metadata?: ChatMetadata | null
  trace?: any[]
  timestamp: number
}

const WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Hello! I'm your AI customer support assistant. I can help you with tickets, orders, appointments, and more. What would you like to do?",
  metadata: {
    type: 'quick_replies',
    options: [
      { label: 'Create Ticket', value: 'I need to create a ticket' },
      { label: 'Track Order', value: 'I want to check my order' },
      { label: 'Book Appointment', value: 'I want to book an appointment' },
      { label: 'Talk to Human', value: 'I want to talk to a human agent' },
    ],
  },
  timestamp: Date.now(),
}

const NODE_COLORS: Record<string, string> = {
  understand: '#3B82F6',
  retrieveKnowledge: '#A855F7',
  decideAction: '#F59E0B',
  captureLead: '#22C55E',
  bookAppointment: '#06B6D4',
  createTicket: '#F97316',
  lookupOrder: '#6366F1',
  escalateToHuman: '#EF4444',
  respond: '#10B981',
}

function TypingDots() {
  const dots = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, { toValue: 1, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(140 * (3 - i)),
        ])
      )
    )
    anims.forEach((a) => a.start())
    return () => anims.forEach((a) => a.stop())
  }, [dots])

  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: Colors.primary,
            opacity: dot,
          }}
        />
      ))}
    </View>
  )
}

function TraceChips({ trace }: { trace: any[] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <View style={{ marginTop: 6 }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name="git-branch-outline" size={12} color={Colors.mutedForeground} />
        <Text style={{ fontSize: 11, color: Colors.mutedForeground }}>
          {trace.length} graph nodes {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View style={{ marginTop: 6, backgroundColor: Colors.cardAlt, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.border }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {trace.map((step, j) => {
              const name = Object.keys(step)[0]
              const color = NODE_COLORS[name] || '#64748B'
              return (
                <View key={j} style={{ backgroundColor: color, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{name}</Text>
                </View>
              )
            })}
          </View>
          {trace.map((step, j) => {
            const name = Object.keys(step)[0]
            const color = NODE_COLORS[name] || '#64748B'
            const data = step[name]
            return (
              <View key={j} style={{ flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginTop: 3 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.foreground, fontSize: 11, fontWeight: '600' }}>{name}</Text>
                  {Object.keys(data).length > 0 && (
                    <Text style={{ color: Colors.mutedForeground, fontSize: 10, marginTop: 2 }} numberOfLines={4}>
                      {JSON.stringify(data, null, 1)}
                    </Text>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

export default function ChatScreen() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const conversationIdRef = useRef<string>(Math.random().toString(36).substring(2))

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const data = await apiFetch<{ response: string; metadata?: ChatMetadata; trace: any[] }>('/agent/chat', {
        method: 'POST',
        body: JSON.stringify({ conversationId: conversationIdRef.current, message: text }),
      })

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.response,
        metadata: data.metadata,
        trace: data.trace,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: 'Sorry, something went wrong. Please try again.', timestamp: Date.now() },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading])

  const handleReset = () => {
    setMessages([WELCOME_MSG])
    conversationIdRef.current = Math.random().toString(36).substring(2)
  }

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user'

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble" size={14} color={Colors.primary} />
          </View>
        )}
        <View style={{ maxWidth: '78%' }}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
            <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
              {item.text}
            </Text>
          </View>

          {/* Buttons */}
          {item.metadata && item.metadata.options.length > 0 && (
            <View style={{ marginTop: 8, gap: 6 }}>
              {item.metadata.title && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Ionicons name="sparkles" size={12} color="#FACC15" />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#FACC15' }}>{item.metadata.title}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {item.metadata.options.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => sendMessage(opt.value)}
                    disabled={loading}
                    activeOpacity={0.7}
                    style={[
                      styles.button,
                      item.metadata?.type === 'confirmation' ? styles.buttonConfirm : styles.buttonDefault,
                      loading && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={[styles.buttonText, item.metadata?.type === 'confirmation' ? styles.buttonTextConfirm : styles.buttonTextDefault]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Trace */}
          {item.trace && item.trace.length > 0 && <TraceChips trace={item.trace} />}
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={14} color={Colors.mutedForeground} />
          </View>
        )}
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>AI Customer Support</Text>
            <Text style={styles.headerSub}>LangGraph Powered</Text>
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.headerBtn}>
            <Ionicons name="refresh" size={20} color={Colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 10 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />

        {/* Typing */}
        {loading && (
          <View style={styles.messageRow}>
            <View style={styles.botAvatar}>
              <Ionicons name="chatbubble" size={14} color={Colors.primary} />
            </View>
            <View style={[styles.bubble, styles.bubbleBot]}>
              <TypingDots />
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor={Colors.mutedForeground}
            style={styles.textInput}
            editable={!loading}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={[styles.sendBtn, (loading || !input.trim()) && { opacity: 0.4 }]}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: Colors.foreground, fontSize: 16, fontWeight: '700' },
  headerSub: { color: Colors.mutedForeground, fontSize: 11, marginTop: 1 },

  messageRow: { flexDirection: 'row', gap: 8, marginBottom: 14, alignItems: 'flex-end' },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowBot: { justifyContent: 'flex-start' },

  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 6 },
  bubbleBot: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 6 },

  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextBot: { color: Colors.foreground },

  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  buttonConfirm: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buttonDefault: {
    backgroundColor: Colors.muted,
    borderColor: Colors.border,
  },
  buttonText: { fontSize: 12, fontWeight: '600' },
  buttonTextConfirm: { color: '#fff' },
  buttonTextDefault: { color: Colors.foreground },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    color: Colors.foreground,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
