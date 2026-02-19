import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import AgentExploreModal from '@/components/modal/agent-explore-modal';
import { agents_explore } from '@/data/agents-explore';
import type { AgentExplore } from '@/types/types';
import SofiaAvatar3D from '../components/SofiaAvatar3D';

interface VoiceChatProps {
  agentId?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ agentId }) => {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentExplore | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [mouthOpen, setMouthOpen] = useState(0);
  const hasAgentId = Boolean(agentId?.trim());
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
    console.log('Received JSON data:', data);
    
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
    status,
    isSpeaking,
    getOutputByteFrequencyData,
    getOutputVolume,
  } = useConversation({
    onConnect: () => {
      console.log('Connected to conversation');
    },
    onDisconnect: () => {
      console.log('Disconnected from conversation');
    },
    onError: (error: any) => {
      console.error('Conversation error:', error);
    },
    onMessage: (message: any) => {
      console.log('Received message:', message);
      handleJsonResponse(message);

      const text = extractTextFromEvent(message);
      if (text) {
        appendMessage(getRoleFromEvent(message), text);
      }
    },
    onAgentChatResponsePart: (part: any) => {
      const text = extractTextFromEvent(part);
      if (text) {
        appendMessage('agent', text);
      }
    },
  });

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
  }, [getOutputByteFrequencyData, getOutputVolume, isSpeaking, status]);

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
        },
      } as any);
      return true;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      return false;
    }
  }, [agentId, hasAgentId, isPermissionGranted, openAgentModal, startSession]);

  const endConversation = useCallback(async () => {
    await endSession();
  }, [endSession]);

  const handleSendMessage = useCallback(async () => {
    const text = messageInput.trim();
    if (!text || !hasAgentId) return;

    appendMessage('user', text);
    setMessageInput('');

    if (status === 'disconnected') {
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
  }, [appendMessage, hasAgentId, messageInput, sendUserMessage, startConversation, status]);

  const handleToggleCall = () => {
    if (status === 'disconnected') {
      startConversation();
    } else {
      endConversation();
    }
  };

  return (
    <>
      <div className="h-full min-h-[calc(100vh-8rem)] w-full p-4">
        <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[460px_1fr]">
          <aside className="bg-white p-6 flex flex-col items-center justify-center gap-6">
            {!hasAgentId && (
              <div className="w-full rounded-md border border-destructive/40 bg-card px-3 py-2 text-xs text-destructive">
                Falta <strong>VITE_ELEVENLABS_AGENT_ID</strong> en tu .env. Agrégalo y reinicia el servidor de desarrollo.
              </div>
            )}

            {status === 'connecting' ? (
              <div className="h-40 w-40 animate-spin rounded-full border-b-2 border-primary" />
            ) : (
              <div className="relative flex w-full justify-center overflow-visible">
                <SofiaAvatar3D mouthOpen={mouthOpen} isSpeaking={status === 'connected' && isSpeaking} />
              </div>
            )}

            <button
              onClick={handleToggleCall}
              disabled={status === 'connecting' || !hasAgentId}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'connected' ? 'Finalizar chat de voz' : 'Iniciar chat de voz'}
            </button>
          </aside>

          <section className="flex h-full flex-col rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Conversación</h3>
              <span className="text-xs text-muted-foreground capitalize">{status}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
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
                disabled={!messageInput.trim() || !hasAgentId || status === 'connecting'}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </section>
        </div>
      </div>

      <AgentExploreModal
        agent={selectedAgent}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
};

export default VoiceChat;
