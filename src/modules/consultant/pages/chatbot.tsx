import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { useLocation, useNavigate } from 'react-router-dom';
import AgentExploreModal from '@/components/modal/agent-explore-modal';
import { agents_explore } from '@/data/agents-explore';
import type { AgentExplore } from '@/types/types';
import { useAuth } from '@/shared/hooks/use-auth';
import SofiaAvatar3D from '../components/SofiaAvatar3D';

const COURSE_FORM_PREFILL_STORAGE_KEY = 'ofi_course_form_prefill';
const FILL_FORM_EVENT_NAME = 'ofi:fill-course-creation-form';
const PLAN_FORM_PREFILL_STORAGE_KEY = 'ofi_plan_form_prefill';
const FILL_PLAN_FORM_EVENT_NAME = 'ofi:fill-plan-form';
const CREATE_NEW_MODULE_STORAGE_KEY = 'ofi_plan_module_prefill';
const CREATE_NEW_MODULE_EVENT_NAME = 'ofi:create-new-module';
const DEFAULT_MOOD_EMOTICON = '🙂';

const MOOD_EMOTICONS: Record<string, string> = {
  happy: '😊✨',
  excited: '🤩⚡',
  concerned: '😟💭',
  patient: '🙂🕰️',
  chuckles: '😄🎵',
  coughs: '😷🤧',
  'french accent': '🥖🇫🇷',
  'us accent': '🗽🇺🇸',
  whispering: '🤫🫶',
  sad: '😢🌧️',
  laughing: '😂🎉',
  angry: '😠🔥',
  sighs: '😮‍💨🍃',
  disappointed: '😞💔',
  enthusiastic: '😁🚀',
  serious: '🧐📌',
  singing: '🎤🎶',
};

const HAPPY_STYLE_MOODS = new Set([
  'happy',
  'excited',
  'laughing',
  'enthusiastic',
  'chuckles',
  'singing',
]);

interface VoiceChatProps {
  agentId?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

type ToolFillPlanPayload = {
  titulo?: string;
  descripcion?: string;
  objetivos?: string;
  duracion_semanas?: number | string;
};

type ToolCreateNewModulePayload = {
  title?: string;
  description?: string;
  titulo?: string;
  descripcion?: string;
};

export const VoiceChat: React.FC<VoiceChatProps> = ({ agentId }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentExplore | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [mouthOpen, setMouthOpen] = useState(0);
  const [isAvatarHappy, setIsAvatarHappy] = useState(false);
  const [showHappyEmoticon, setShowHappyEmoticon] = useState(false);
  const [currentMoodEmoticon, setCurrentMoodEmoticon] = useState(DEFAULT_MOOD_EMOTICON);
  const [isDockVisible, setIsDockVisible] = useState(false);
  const hasAgentId = Boolean(agentId?.trim());
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const happyStateTimeoutRef = useRef<number | null>(null);
  const happyEmoticonTimeoutRef = useRef<number | null>(null);
  const previousUserKeyRef = useRef<string | null>(null);
  const isFullView = location.pathname === '/chatbot';
  const isElevenLabsDebugEnabled = import.meta.env.VITE_DEBUG_ELEVENLABS === 'true';
  const currentUserKey = user ? `${user.id}-${user.email}` : 'anonymous';

  const logElevenLabsDebug = useCallback((...args: unknown[]) => {
    if (!isElevenLabsDebugEnabled) return;
    console.log(...args);
  }, [isElevenLabsDebugEnabled]);

  const logElevenLabsError = useCallback((...args: unknown[]) => {
    if (!isElevenLabsDebugEnabled) return;
    console.error(...args);
  }, [isElevenLabsDebugEnabled]);

  const appendMessage = useCallback((role: 'user' | 'agent', text: string) => {
    const normalizedText = text.trim();
    if (!normalizedText) return;

    setChatMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && last.text === normalizedText) {
        return prev;
      }

      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role,
          text: normalizedText,
        },
      ];
    });
  }, []);

  const extractTextFromEvent = useCallback((payload: any): string | null => {
    if (!payload) return null;
    if (typeof payload === 'string') return payload;

    const candidateFields = [
      payload.message,
      payload.text,
      payload.content,
      payload.transcript,
      payload.response,
      payload.agent_response,
      payload?.message?.text,
      payload?.content?.text,
      payload?.data?.text,
    ];

    for (const candidate of candidateFields) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }

    return null;
  }, []);

  const getRoleFromEvent = useCallback((payload: any): 'user' | 'agent' => {
    const roleCandidate = String(payload?.role || payload?.source || payload?.speaker || '').toLowerCase();
    if (roleCandidate.includes('user') || roleCandidate.includes('human')) {
      return 'user';
    }
    return 'agent';
  }, []);

  const parseMoodTaggedText = useCallback((text: string): { text: string; mood?: string } => {
    const moodTagMatch = text.match(/^\s*\[([^\]]+)\]\s*(.*)$/s);
    if (!moodTagMatch) {
      return { text: text.trim() };
    }

    const [, rawMood, content] = moodTagMatch;
    return {
      mood: rawMood.trim().toLowerCase(),
      text: content.trim(),
    };
  }, []);

  const triggerMoodFeedback = useCallback((rawMood: string) => {
    const normalizedMood = rawMood.trim().toLowerCase();

    if (happyStateTimeoutRef.current) {
      window.clearTimeout(happyStateTimeoutRef.current);
    }
    if (happyEmoticonTimeoutRef.current) {
      window.clearTimeout(happyEmoticonTimeoutRef.current);
    }

    setCurrentMoodEmoticon(MOOD_EMOTICONS[normalizedMood] || DEFAULT_MOOD_EMOTICON);
    setIsAvatarHappy(HAPPY_STYLE_MOODS.has(normalizedMood));
    setShowHappyEmoticon(true);

    happyStateTimeoutRef.current = window.setTimeout(() => {
      setIsAvatarHappy(false);
      happyStateTimeoutRef.current = null;
    }, 1000);

    happyEmoticonTimeoutRef.current = window.setTimeout(() => {
      setShowHappyEmoticon(false);
      happyEmoticonTimeoutRef.current = null;
    }, 2500);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, isFullView]);

  useEffect(() => {
    return () => {
      if (happyStateTimeoutRef.current) {
        window.clearTimeout(happyStateTimeoutRef.current);
      }
      if (happyEmoticonTimeoutRef.current) {
        window.clearTimeout(happyEmoticonTimeoutRef.current);
      }
    };
  }, []);

  // Check microphone permission on component mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setIsPermissionGranted(result.state === 'granted');
      } catch (error) {
        console.warn('La API de permisos no es compatible');
      }
    };
    checkPermission();
  }, []);

  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Acceso al micrófono denegado:', error);
      return false;
    }
  };

  const handleJsonResponse = (data: any) => {
    logElevenLabsDebug('[ElevenLabs][IN][JSON]', data);
    
    // Try to extract message content from various possible formats
    let messageContent = data;
    if (data && data.message) {
      messageContent = data.message;
    } else if (data && data.text) {
      messageContent = data.text;
    } else if (data && data.content) {
      messageContent = data.content;
    }
    
    // Check for close modal command
    if (messageContent && (
        messageContent.CLOSEMODAL || 
        messageContent.closeModal || 
        (typeof messageContent === 'string' && messageContent.includes('CLOSEMODAL'))
      )) {
      setIsModalOpen(false);
      setSelectedAgent(null);
      console.log('Closing modal via voice command');
      return;
    }
    
    // Check if the content contains OPENMODALEMAIL
    if (messageContent && (
        messageContent.OPENMODALEMAIL || 
        messageContent.openModalEmail || 
        (typeof messageContent === 'string' && messageContent.includes('OPENMODALEMAIL'))
      )) {
      
      // Find the email agent (ID 6 based on the agents data)
      const emailAgent = agents_explore.find((agent: AgentExplore) => 
        agent.id === "6" || 
        agent.title.toLowerCase().includes('email') ||
        agent.title.toLowerCase().includes('mailo')
      );
      
      if (emailAgent) {
        setSelectedAgent(emailAgent);
        setIsModalOpen(true);
        console.log('Opening email agent modal:', emailAgent);
      } else {
        console.warn('Email agent not found in available agents');
      }
    }
    
    // If it's a string, try to parse as JSON
    if (typeof messageContent === 'string') {
      try {
        const parsed = JSON.parse(messageContent);
        
        // Check for close modal in parsed JSON
        if (parsed.CLOSEMODAL || parsed.closeModal) {
          setIsModalOpen(false);
          setSelectedAgent(null);
          console.log('Closing modal via voice command from parsed JSON');
          return;
        }
        
        if (parsed.OPENMODALEMAIL || parsed.openModalEmail) {
          const emailAgent = agents_explore.find((agent: AgentExplore) => 
            agent.id === "6" || 
            agent.title.toLowerCase().includes('email') ||
            agent.title.toLowerCase().includes('mailo')
          );
          
          if (emailAgent) {
            setSelectedAgent(emailAgent);
            setIsModalOpen(true);
            console.log('Opening email agent modal from parsed JSON:', emailAgent);
          }
        }
      } catch (e) {
        // If parsing fails, check if the string contains triggers
        if (messageContent.includes('CLOSEMODAL')) {
          setIsModalOpen(false);
          setSelectedAgent(null);
          console.log('Closing modal via voice command from string content');
          return;
        }
        
        if (messageContent.includes('OPENMODALEMAIL')) {
          const emailAgent = agents_explore.find((agent: AgentExplore) => 
            agent.id === "6" || 
            agent.title.toLowerCase().includes('email') ||
            agent.title.toLowerCase().includes('mailo')
          );
          
          if (emailAgent) {
            setSelectedAgent(emailAgent);
            setIsModalOpen(true);
            console.log('Opening email agent modal from string content:', emailAgent);
          }
        }
      }
    }
  };

  const closeModal = useCallback(() => {
    console.log('Closing agent explore modal');
    setIsModalOpen(false);
    setSelectedAgent(null);
  }, []);

  const openAgentModal = useCallback((targetAgentId: string, toolName: string) => {
    console.log(`Opening agent modal via ${toolName} tool`);
    const agent = agents_explore.find((a: AgentExplore) => a.id === targetAgentId);

    if (agent) {
      setTimeout(() => {
        setSelectedAgent(agent);
        setIsModalOpen(true);
        console.log(`${toolName} agent modal opened:`, agent);
      }, 500);
    } else {
      console.warn(`Agent with ID ${targetAgentId} not found in available agents`);
    }
  }, []);

  const {
    startSession,
    endSession,
    sendUserMessage,
    status: conversationStatus,
    isSpeaking,
    getOutputByteFrequencyData,
    getOutputVolume,
  } = useConversation({
    onConnect: () => {
      logElevenLabsDebug('[ElevenLabs][STATE] Connected to conversation');
    },
    onDisconnect: () => {
      logElevenLabsDebug('[ElevenLabs][STATE] Disconnected from conversation');
    },
    onError: (error: any) => {
      logElevenLabsError('[ElevenLabs][IN][ERROR]', error);
    },
    onMessage: (message: any) => {
      logElevenLabsDebug('[ElevenLabs][IN][MESSAGE]', message);
      handleJsonResponse(message);

      const text = extractTextFromEvent(message);
      if (text) {
        const { text: cleanedText, mood } = parseMoodTaggedText(text);

        if (mood) {
          triggerMoodFeedback(mood);
        }

        if (cleanedText) {
          appendMessage(getRoleFromEvent(message), cleanedText);
        }
      }
    },
    onAgentChatResponsePart: (part: any) => {
      logElevenLabsDebug('[ElevenLabs][IN][AGENT_PART]', part);
      const text = extractTextFromEvent(part);
      if (text) {
        const { text: cleanedText, mood } = parseMoodTaggedText(text);

        if (mood) {
          triggerMoodFeedback(mood);
        }

        if (cleanedText) {
          appendMessage('agent', cleanedText);
        }
      }
    },
  });

  useEffect(() => {
    if (conversationStatus === 'connected' || conversationStatus === 'connecting') {
      setIsDockVisible(true);
    }
  }, [conversationStatus]);

  useEffect(() => {
    let frameId = 0;

    const animateMouth = () => {
      const outputFrequency = getOutputByteFrequencyData();
      let audioLevel = 0;

      if (outputFrequency && outputFrequency.length > 0) {
        let sum = 0;
        for (let index = 0; index < outputFrequency.length; index += 1) {
          sum += outputFrequency[index];
        }
        audioLevel = (sum / outputFrequency.length) / 255;
      } else {
        audioLevel = getOutputVolume();
      }

      const speechBoost = isSpeaking ? 0.08 : 0;
      const target = Math.min(1, Math.max(0, audioLevel * 2.2 + speechBoost));

      setMouthOpen((previous) => previous + (target - previous) * 0.28);
      frameId = requestAnimationFrame(animateMouth);
    };

    frameId = requestAnimationFrame(animateMouth);
    return () => cancelAnimationFrame(frameId);
  }, [getOutputByteFrequencyData, getOutputVolume, isSpeaking, conversationStatus]);

  const startConversation = useCallback(async () => {
    if (!hasAgentId || !agentId) {
      console.error('No se proporcionó un ID de agente');
      return false;
    }

    if (!isPermissionGranted) {
      const granted = await requestMicrophoneAccess();
      if (!granted) return false;
    }

    try {
      logElevenLabsDebug('[ElevenLabs][OUT][START_SESSION]', {
        agentId,
        tools: [
          'CloseModal',
          'OpenHRAgent',
          'OpenMarketingAgent',
          'OpenSalesAgent',
          'OpenCollectionsAgent',
          'OpenFinancialAgent',
          'OpenEmailAgent',
          'open-create-course',
          'OpenCreateCourse',
          'open-dashboard',
          'open-mis-planes',
          'open-asignaciones',
          'crear-plan',
          'move-to-create-plan',
          'fill-plan-form',
          'create-new-module',
        ],
      });

      await startSession({
        agentId,
        clientTools: {
          CloseModal: async () => {
            console.log('Closing modal via CloseModal tool');
            setIsModalOpen(false);
            setSelectedAgent(null);
          },
          OpenHRAgent: async () => {
            openAgentModal("1", "OpenHRAgent");
          },
          OpenMarketingAgent: async () => {
            openAgentModal("2", "OpenMarketingAgent");
          },
          OpenSalesAgent: async () => {
            openAgentModal("3", "OpenSalesAgent");
          },
          OpenCollectionsAgent: async () => {
            openAgentModal("4", "OpenCollectionsAgent");
          },
          OpenFinancialAgent: async () => {
            openAgentModal("5", "OpenFinancialAgent");
          },
          OpenEmailAgent: async () => {
            openAgentModal("6", "OpenEmailAgent");
          },
          "open-create-course": async () => {
            setIsDockVisible(true);
            navigate('/courses?view=create');
          },
          OpenCreateCourse: async () => {
            setIsDockVisible(true);
            navigate('/courses?view=create');
          },
          "open-dashboard": async () => {
            setIsDockVisible(true);
            navigate(user?.role === 'director' ? '/director/dashboard' : '/teacher/dashboard');
          },
          "open-mis-planes": async () => {
            setIsDockVisible(true);
            navigate(user?.role === 'director' ? '/director/plans' : '/teacher/plans');
          },
          "open-asignaciones": async () => {
            setIsDockVisible(true);
            navigate('/director/assignments');
          },
          "crear-plan": async () => {
            setIsDockVisible(true);
            navigate('/director/plans/new');
          },
          "move-to-create-plan": async () => {
            setIsDockVisible(true);
            navigate('/director/plans/new');
          },
          "fill-plan-form": async (payload: ToolFillPlanPayload) => {
            logElevenLabsDebug('[ElevenLabs][TOOL][fill-plan-form]', payload);

            localStorage.setItem(PLAN_FORM_PREFILL_STORAGE_KEY, JSON.stringify(payload || {}));
            setIsDockVisible(true);
            navigate('/director/plans/new');
            appendMessage('agent', 'Formulario del plan completado. ¿Quieres que empecemos a agregar módulos?');

            window.dispatchEvent(new CustomEvent(FILL_PLAN_FORM_EVENT_NAME, {
              detail: payload || {},
            }));
          },
          "create-new-module": async (payload: ToolCreateNewModulePayload) => {
            logElevenLabsDebug('[ElevenLabs][TOOL][create-new-module]', payload);

            localStorage.setItem(CREATE_NEW_MODULE_STORAGE_KEY, JSON.stringify(payload || {}));
            setIsDockVisible(true);
            navigate('/director/plans/new');

            window.dispatchEvent(new CustomEvent(CREATE_NEW_MODULE_EVENT_NAME, {
              detail: payload || {},
            }));
          },
          CreateNewModule: async (payload: ToolCreateNewModulePayload) => {
            logElevenLabsDebug('[ElevenLabs][TOOL][CreateNewModule]', payload);

            localStorage.setItem(CREATE_NEW_MODULE_STORAGE_KEY, JSON.stringify(payload || {}));
            setIsDockVisible(true);
            navigate('/director/plans/new');

            window.dispatchEvent(new CustomEvent(CREATE_NEW_MODULE_EVENT_NAME, {
              detail: payload || {},
            }));
          },
          FillPlanForm: async (payload: ToolFillPlanPayload) => {
            logElevenLabsDebug('[ElevenLabs][TOOL][FillPlanForm]', payload);

            localStorage.setItem(PLAN_FORM_PREFILL_STORAGE_KEY, JSON.stringify(payload || {}));
            setIsDockVisible(true);
            navigate('/director/plans/new');
            appendMessage('agent', 'Formulario del plan completado. ¿Quieres que empecemos a agregar módulos?');

            window.dispatchEvent(new CustomEvent(FILL_PLAN_FORM_EVENT_NAME, {
              detail: payload || {},
            }));
          },
          "fill-course-creation-form": async (payload: Record<string, unknown>) => {
            logElevenLabsDebug('[ElevenLabs][TOOL][fill-course-creation-form]', payload);

            localStorage.setItem(COURSE_FORM_PREFILL_STORAGE_KEY, JSON.stringify(payload || {}));
            setIsDockVisible(true);
            navigate('/courses?view=create');

            window.dispatchEvent(new CustomEvent(FILL_FORM_EVENT_NAME, {
              detail: payload || {},
            }));
          },
          FillCourseCreationForm: async (payload: Record<string, unknown>) => {
            logElevenLabsDebug('[ElevenLabs][TOOL][FillCourseCreationForm]', payload);

            localStorage.setItem(COURSE_FORM_PREFILL_STORAGE_KEY, JSON.stringify(payload || {}));
            setIsDockVisible(true);
            navigate('/courses?view=create');

            window.dispatchEvent(new CustomEvent(FILL_FORM_EVENT_NAME, {
              detail: payload || {},
            }));
          },
        },
      } as any);
      return true;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      return false;
    }
  }, [agentId, appendMessage, hasAgentId, isPermissionGranted, logElevenLabsDebug, navigate, openAgentModal, startSession, user?.role]);

  const endConversation = useCallback(async () => {
    logElevenLabsDebug('[ElevenLabs][OUT][END_SESSION]');
    await endSession();
    setIsDockVisible(false);
  }, [endSession, logElevenLabsDebug]);

  useEffect(() => {
    const previousUserKey = previousUserKeyRef.current;

    if (previousUserKey !== null && previousUserKey !== currentUserKey) {
      setChatMessages([]);
      setMessageInput('');
      setIsModalOpen(false);
      setSelectedAgent(null);
      setIsDockVisible(false);
      setMouthOpen(0);
      setIsAvatarHappy(false);
      setShowHappyEmoticon(false);
      setCurrentMoodEmoticon(DEFAULT_MOOD_EMOTICON);

      if (conversationStatus !== 'disconnected') {
        void endSession();
      }
    }

    previousUserKeyRef.current = currentUserKey;
  }, [conversationStatus, currentUserKey, endSession]);

  const handleSendMessage = useCallback(async () => {
    const text = messageInput.trim();
    if (!text || !hasAgentId) return;

    logElevenLabsDebug('[ElevenLabs][OUT][USER_MESSAGE]', { text });

    appendMessage('user', text);
    setMessageInput('');

    if (conversationStatus === 'disconnected') {
      const connected = await startConversation();
      if (!connected) {
        appendMessage('agent', 'No se pudo iniciar la sesión de voz. Verifica los permisos del micrófono e inténtalo de nuevo.');
        return;
      }
    }

    try {
      sendUserMessage(text);
    } catch (error) {
      console.error('No se pudo enviar el mensaje del usuario:', error);
      appendMessage('agent', 'No pude recibir tu mensaje. Inténtalo de nuevo.');
    }
  }, [appendMessage, hasAgentId, logElevenLabsDebug, messageInput, sendUserMessage, startConversation, conversationStatus]);

  const handleToggleCall = () => {
    if (conversationStatus === 'disconnected') {
      startConversation();
    } else {
      endConversation();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {isFullView && (
        <div className="fixed left-0 right-0 top-16 bottom-0 z-40 p-4 md:left-64 md:top-20">
          <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[460px_1fr]">
            <aside className="bg-white p-6 flex flex-col items-center justify-center gap-6">
              {!hasAgentId && (
                <div className="w-full rounded-md border border-destructive/40 bg-card px-3 py-2 text-xs text-destructive">
                  Falta <strong>VITE_ELEVENLABS_AGENT_ID</strong> en tu .env. Agrégalo y reinicia el servidor de desarrollo.
                </div>
              )}

              {conversationStatus === 'connecting' ? (
                <div className="h-40 w-40 animate-spin rounded-full border-b-2 border-primary" />
              ) : (
                <div className="relative flex w-full justify-center overflow-visible">
                  <SofiaAvatar3D
                    mouthOpen={mouthOpen}
                    isSpeaking={conversationStatus === 'connected' && isSpeaking}
                    isHappy={isAvatarHappy}
                    showHappyEmoticon={showHappyEmoticon}
                    emoticon={currentMoodEmoticon}
                  />
                </div>
              )}

              <button
                onClick={handleToggleCall}
                disabled={conversationStatus === 'connecting' || !hasAgentId}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {conversationStatus === 'connected' ? 'Finalizar chat de voz' : 'Iniciar chat de voz'}
              </button>
            </aside>

            <section className="flex h-[95%] min-h-0 flex-col rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Conversación</h3>
                <span className="text-xs text-muted-foreground capitalize">{conversationStatus}</span>
              </div>

              <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {chatMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Empieza a hablar o envía un mensaje para comenzar.</p>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        message.role === 'user'
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'mr-auto bg-muted text-foreground'
                      }`}
                    >
                      {message.text}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex items-center gap-2 border-t border-border p-3">
                <input
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <button
                  onClick={() => void handleSendMessage()}
                  disabled={!messageInput.trim() || !hasAgentId || conversationStatus === 'connecting'}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {!isFullView && isDockVisible && conversationStatus !== 'disconnected' && (
        <div className="fixed bottom-4 right-4 z-50 w-[220px] rounded-xl border border-border bg-card shadow-lg p-3 space-y-3">
          <div className="text-xs font-medium text-foreground">Anita en llamada</div>

          {conversationStatus === 'connecting' ? (
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-b-2 border-primary" />
          ) : (
            <div className="mx-auto w-full max-w-[180px]">
              <SofiaAvatar3D
                mouthOpen={mouthOpen}
                isSpeaking={conversationStatus === 'connected' && isSpeaking}
                isHappy={isAvatarHappy}
                showHappyEmoticon={showHappyEmoticon}
                emoticon={currentMoodEmoticon}
              />
            </div>
          )}

          <button
            onClick={() => void endConversation()}
            className="w-full rounded-md bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground"
          >
            Colgar
          </button>
        </div>
      )}

      {!isFullView && conversationStatus === 'disconnected' && (
        <button
          onClick={() => {
            setIsDockVisible(true);
            void startConversation();
          }}
          disabled={!hasAgentId}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          Llamar a Anita
        </button>
      )}

      <AgentExploreModal
        agent={selectedAgent}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
};

export default VoiceChat;
