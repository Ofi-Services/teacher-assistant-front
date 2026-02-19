import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import sofiaHeadImage from '@/assets/react.svg';
import sofiaSpeakingGif from '@/assets/react.svg';
import AgentExploreModal from '@/components/modal/agent-explore-modal';
import { agents_explore } from '@/data/agents-explore';
import type { AgentExplore } from '@/types/types';

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
        console.warn('Permission API not supported');
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
      console.error('Microphone access denied:', error);
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

  const startConversation = useCallback(async () => {
    if (!hasAgentId || !agentId) {
      console.error('No agent ID provided');
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
        appendMessage('agent', 'Unable to start voice session. Please check microphone permissions and try again.');
        return;
      }
    }

    try {
      sendUserMessage(text);
    } catch (error) {
      console.error('Failed to send user message:', error);
      appendMessage('agent', 'I could not receive your message. Please try again.');
    }
  }, [appendMessage, hasAgentId, messageInput, sendUserMessage, startConversation, status]);

  const handleToggleCall = () => {
    if (status === 'disconnected') {
      startConversation();
    } else {
      endConversation();
    }
  };

  const getButtonColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-transparent hover:bg-transparent';
      case 'connecting':
        return 'bg-yellow-600 hover:bg-yellow-700';
      default:
        return 'bg-transparent hover:bg-transparent';
    }
  };

  const getButtonIcon = () => {
    const activeSpeaking = status === 'connected' && isSpeaking;
    const containerSize = activeSpeaking ? 'h-32 w-32' : 'h-28 w-28';
    

    const imageSrc = activeSpeaking ? sofiaSpeakingGif : sofiaHeadImage;
    
    return (
      <div className={`relative ${containerSize} transition-all duration-500 overflow-hidden`}>
        <img 
          src={imageSrc}
          alt="Sofia AI Assistant" 
          className={`w-full h-full object-cover transition-all duration-500`}
        />
      </div>
    );
  };

  const getButtonText = () => {
    if (!hasAgentId) {
      return 'Missing ElevenLabs Agent ID';
    }

    switch (status) {
      case 'connected':
        return 'End Call';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Start Voice Chat';
    }
  };

  return (
    <>
      {!hasAgentId && (
        <div className="fixed bottom-40 right-4 z-50 max-w-xs rounded-md border border-destructive/40 bg-card px-3 py-2 text-xs text-destructive shadow-lg">
          Missing <strong>VITE_ELEVENLABS_AGENT_ID</strong> in your .env. Add it and restart the dev server.
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50">
        <div className="mb-3 w-[360px] rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <h3 className="text-sm font-semibold text-foreground">Sofia Voice + Chat</h3>
            <span className="text-xs text-muted-foreground capitalize">{status}</span>
          </div>

          <div className="h-72 overflow-y-auto px-3 py-2 space-y-2">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-muted-foreground">Start speaking or send a text message to begin.</p>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
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
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <button
              onClick={() => void handleSendMessage()}
              disabled={!messageInput.trim() || !hasAgentId || status === 'connecting'}
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>

        <button
          onClick={handleToggleCall}
          disabled={status === 'connecting' || !hasAgentId}
          className={`${getButtonColor()} text-white p-0 rounded-full shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group relative hover:drop-shadow-2xl`}
          aria-label={getButtonText()}
          title={getButtonText()}
        >
          {status === 'connecting' ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            getButtonIcon()
          )}
          

          {status === 'connected' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          )}
          

          <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 text-sm bg-black text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {getButtonText()}
          </span>
        </button>
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
