import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, TowerControl, Radio, Timer, Users, Send, Shuffle, AlertTriangle, Plus, Smile, Reply, X, Settings, Volume2, VolumeX, Bell, BellOff, Smartphone } from 'lucide-react';
import { Room, Message, NotificationSettings, User } from '../types';

interface ChatViewProps {
  room: Room;
  rooms: Room[];
  messages: Message[];
  members: User[];
  onBack: () => void;
  onSendMessage: (text: string, parentId?: string) => void;
  onSetStatus: (status: 'online' | 'away' | 'offline') => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  userAlias: string;
  onScramble: () => void;
  onRoomSelect: (room: Room) => void;
  onDeployClick: () => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '💯', '⚡'];

interface MessageItemProps {
  msg: Message;
  messages: Message[];
  members: User[];
  userAlias: string;
  onSendMessage: (text: string, parentId?: string) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  activeReactionPicker: string | null;
  toggleReactionPicker: (messageId: string) => void;
  handleReactionSelect: (messageId: string, emoji: string) => void;
  setReplyingTo: (msg: Message) => void;
  depth?: number;
}

const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  messages,
  members,
  userAlias,
  onSendMessage,
  onReactToMessage,
  activeReactionPicker,
  toggleReactionPicker,
  handleReactionSelect,
  setReplyingTo,
  depth = 0
}) => {
  const replies = messages.filter(m => m.parentId === msg.id);
  const isSystem = msg.type === 'system';
  const isSelf = msg.senderAlias === userAlias;

  const sender = members.find(m => m.alias === msg.senderAlias);
  const statusColor = sender?.status === 'online' ? 'bg-primary' : sender?.status === 'away' ? 'bg-yellow-500' : 'bg-danger';

  return (
    <div className={`flex flex-col gap-1 ${depth > 0 ? 'ml-6 pl-4 border-l border-muted/20 mt-2' : 'p-2 -mx-2 rounded hover:bg-surface/30'} transition-colors group relative ${isSelf && depth === 0 ? 'bg-primary/5 border-l-2 border-primary' : ''}`}>
      <div className="flex items-baseline gap-3">
        <span className="text-muted text-[10px] md:text-xs shrink-0">[{msg.timestamp}]</span>
        {isSystem ? (
          <span className={`font-bold w-full uppercase flex items-center gap-2 ${msg.text.includes('destruct') ? 'text-danger' : 'text-primary'} ${depth > 0 ? 'text-xs' : ''}`}>
            {msg.text.includes('destruct') && <AlertTriangle size={16} />}
            {msg.text}
          </span>
        ) : (
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <div className="flex items-center gap-1.5">
                {!isSystem && <div className={`w-1.5 h-1.5 rounded-full ${statusColor} ${sender?.status === 'online' ? 'animate-pulse shadow-neon-primary' : ''}`} />}
                <span className={`font-bold shrink-0 ${isSelf ? 'text-white' : 'text-accent'} ${depth > 0 ? 'text-xs' : 'text-sm'}`}>
                  &lt;{msg.senderAlias}&gt;
                </span>
              </div>
              <span className={`text-text-main break-words ${depth > 0 ? 'text-xs opacity-90' : 'text-sm'}`}>{msg.text}</span>
              
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 relative">
                <button 
                  onClick={() => setReplyingTo(msg)}
                  className="p-1 text-muted hover:text-accent transition-colors rounded hover:bg-accent/10"
                  title="Reply"
                >
                  <Reply size={depth > 0 ? 14 : 16} />
                </button>
                <button 
                  onClick={() => toggleReactionPicker(msg.id)}
                  className="p-1 text-muted hover:text-primary transition-colors rounded hover:bg-primary/10"
                  title="React"
                >
                  <Smile size={depth > 0 ? 14 : 16} />
                </button>
                
                <AnimatePresence>
                  {activeReactionPicker === msg.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute bottom-full right-0 mb-2 p-2 bg-surface border border-primary rounded shadow-neon-primary z-30 flex gap-1"
                    >
                      {COMMON_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReactionSelect(msg.id, emoji)}
                          className={`p-1 hover:bg-primary/20 rounded transition-colors ${depth > 0 ? 'text-base' : 'text-lg'} leading-none`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {msg.reactions && msg.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1 ml-0">
                {msg.reactions.map(reaction => (
                  <button
                    key={reaction.emoji}
                    onClick={() => onReactToMessage(msg.id, reaction.emoji)}
                    className={`px-2 py-0.5 rounded-full font-mono flex items-center gap-1.5 transition-all border ${
                      reaction.userIds.includes('self') 
                        ? 'bg-primary/20 border-primary text-primary shadow-[0_0_8px_rgba(19,236,106,0.3)]' 
                        : 'bg-surface border-muted text-muted hover:border-accent/50'
                    } ${depth > 0 ? 'text-[10px]' : 'text-xs'}`}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="font-bold">{reaction.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recursive Replies */}
      {replies.length > 0 && (
        <div className="flex flex-col">
          {replies.map(reply => (
            <MessageItem 
              key={reply.id}
              msg={reply}
              messages={messages}
              members={members}
              userAlias={userAlias}
              onSendMessage={onSendMessage}
              onReactToMessage={onReactToMessage}
              activeReactionPicker={activeReactionPicker}
              toggleReactionPicker={toggleReactionPicker}
              handleReactionSelect={handleReactionSelect}
              setReplyingTo={setReplyingTo}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ChatView: React.FC<ChatViewProps> = ({
  room,
  rooms,
  messages,
  members,
  onBack,
  onSendMessage,
  onSetStatus,
  onReactToMessage,
  userAlias,
  onScramble,
  onRoomSelect,
  onDeployClick
}) => {
  const [inputText, setInputText] = useState('');
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    vibrationEnabled: true,
    mutedChannels: []
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText, replyingTo?.id);
      setInputText('');
      setReplyingTo(null);
    }
  };

  const toggleReactionPicker = (messageId: string) => {
    setActiveReactionPicker(activeReactionPicker === messageId ? null : messageId);
  };

  const handleReactionSelect = (messageId: string, emoji: string) => {
    onReactToMessage(messageId, emoji);
    setActiveReactionPicker(null);
  };

  const formatTtl = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMuteChannel = (roomId: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      mutedChannels: prev.mutedChannels.includes(roomId)
        ? prev.mutedChannels.filter(id => id !== roomId)
        : [...prev.mutedChannels, roomId]
    }));
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans antialiased bg-background-dark relative">
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface border border-primary/30 w-full max-w-md rounded-lg shadow-neon-primary overflow-hidden"
            >
              <div className="p-6 border-b border-muted/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Settings className="text-primary" size={24} />
                  <h2 className="text-white text-xl font-bold tracking-widest uppercase">Transmission Settings</h2>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="text-muted hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                <section>
                  <h3 className="text-muted text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Transmission Status</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['online', 'away', 'offline'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => onSetStatus(status)}
                        className={`py-2 px-3 rounded border font-mono text-[10px] uppercase tracking-wider transition-all flex flex-col items-center gap-2 ${
                          members.find(m => m.alias === userAlias)?.status === status
                            ? 'border-primary bg-primary/10 text-primary shadow-neon-primary'
                            : 'border-muted text-muted hover:border-primary/50 hover:text-white'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          status === 'online' ? 'bg-primary' : 
                          status === 'away' ? 'bg-yellow-500' : 'bg-danger'
                        } ${members.find(m => m.alias === userAlias)?.status === status && status === 'online' ? 'animate-pulse' : ''}`} />
                        {status}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-muted text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Global Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {notificationSettings.soundEnabled ? <Volume2 className="text-primary" size={20} /> : <VolumeX className="text-danger" size={20} />}
                        <span className="text-text-main font-mono text-sm">Audio Feedback</span>
                      </div>
                      <button 
                        onClick={() => setNotificationSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                        className={`w-12 h-6 rounded-full relative transition-colors ${notificationSettings.soundEnabled ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-background-dark rounded-full transition-all ${notificationSettings.soundEnabled ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className={notificationSettings.vibrationEnabled ? "text-primary" : "text-muted"} size={20} />
                        <span className="text-text-main font-mono text-sm">Haptic Pulse</span>
                      </div>
                      <button 
                        onClick={() => setNotificationSettings(prev => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }))}
                        className={`w-12 h-6 rounded-full relative transition-colors ${notificationSettings.vibrationEnabled ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-background-dark rounded-full transition-all ${notificationSettings.vibrationEnabled ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-muted text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Frequency Muting</h3>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {rooms.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-2 rounded bg-background-dark/50 border border-muted/30">
                        <div className="flex items-center gap-3">
                          <Radio size={16} className={r.id === room.id ? "text-primary" : "text-muted"} />
                          <span className={`font-mono text-xs ${r.id === room.id ? "text-white font-bold" : "text-text-main"}`}>{r.topic}</span>
                        </div>
                        <button 
                          onClick={() => toggleMuteChannel(r.id)}
                          className={`p-1.5 rounded transition-colors ${notificationSettings.mutedChannels.includes(r.id) ? 'bg-danger/20 text-danger' : 'bg-primary/10 text-primary'}`}
                        >
                          {notificationSettings.mutedChannels.includes(r.id) ? <BellOff size={16} /> : <Bell size={16} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-6 bg-background-dark/50 border-t border-muted/50">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-3 bg-primary text-background-dark font-bold uppercase tracking-widest rounded shadow-neon-primary hover:bg-primary/90 transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-muted bg-surface/80 backdrop-blur-sm z-10 relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="text-primary hover:text-white transition-colors flex items-center justify-center p-2 rounded hover:bg-primary/20 cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-neon-primary"></span>
              <h1 className="text-white text-lg font-bold tracking-widest uppercase">{room.topic}</h1>
            </div>
            <span className="text-muted text-xs font-mono uppercase">Freq: {room.frequency} // Range: 100m</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="text-muted hover:text-primary transition-colors flex items-center justify-center p-2 rounded hover:bg-primary/10 cursor-pointer"
            title="Notification Settings"
          >
            <Settings size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-primary font-mono text-sm border border-primary/30 px-3 py-1 bg-primary/5 rounded shadow-neon-primary">
              <TowerControl size={18} />
              <span>CONNECTED</span>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              members.find(m => m.alias === userAlias)?.status === 'online' ? 'bg-primary animate-pulse shadow-neon-primary' : 
              members.find(m => m.alias === userAlias)?.status === 'away' ? 'bg-yellow-500' : 'bg-danger'
            }`} title={`Status: ${members.find(m => m.alias === userAlias)?.status || 'online'}`} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-0">
        <aside className="w-[300px] shrink-0 border-r border-muted bg-surface flex flex-col hidden md:flex">
          <div className="p-4 border-b border-muted/50">
            <h2 className="text-muted text-xs font-bold uppercase tracking-widest mb-1">Active Frequencies</h2>
            <div className="text-[10px] font-mono text-primary animate-pulse uppercase">Scanning 100m radius...</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {rooms.map((r) => (
              <div 
                key={r.id}
                onClick={() => onRoomSelect(r)}
                className={`p-3 rounded cursor-pointer transition-all group border ${
                  r.id === room.id 
                    ? 'border-primary bg-primary/10 shadow-neon-primary' 
                    : 'border-muted hover:border-accent/50 hover:bg-surface/80'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className={`flex items-center gap-2 ${r.id === room.id ? 'text-primary' : 'text-text-main'} group-hover:text-white transition-colors`}>
                    <Radio size={20} fill={r.id === room.id ? 'currentColor' : 'none'} />
                    <span className="font-bold text-sm">{r.topic}</span>
                  </div>
                  <span className={`${r.id === room.id ? 'text-accent' : 'text-muted'} font-mono text-xs`}>[{r.population}/{r.maxPopulation}]</span>
                </div>
                <div className="mt-2 flex justify-between items-center text-xs font-mono">
                  <span className="text-muted">TTL: <span className="text-white">{formatTtl(r.ttl)}</span></span>
                  {r.id === room.id && <span className="text-primary text-[10px] uppercase">Active</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-muted/50">
            <button 
              onClick={onDeployClick}
              className="w-full h-10 bg-surface border border-primary text-primary hover:bg-primary hover:text-background-dark transition-colors font-bold text-sm tracking-wider uppercase rounded flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(19,236,106,0.2)] hover:shadow-neon-primary"
            >
              <Plus size={18} />
              Deploy Frequency
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-background-dark relative">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 font-mono text-sm space-y-3 pb-24">
            <div className="flex flex-col items-center justify-center py-8 opacity-70 border-b border-dashed border-muted/30 mb-6">
              <Radio size={32} className="text-primary mb-2" />
              <p className="text-primary text-center uppercase tracking-widest text-xs">Room Deployed. Waiting for local connections.</p>
              <p className="text-muted text-[10px] mt-1">Encrypted transmission channel established.</p>
            </div>

            {messages.filter(m => !m.parentId).map((msg) => (
              <MessageItem 
                key={msg.id}
                msg={msg}
                messages={messages}
                members={members}
                userAlias={userAlias}
                onSendMessage={onSendMessage}
                onReactToMessage={onReactToMessage}
                activeReactionPicker={activeReactionPicker}
                toggleReactionPicker={toggleReactionPicker}
                handleReactionSelect={handleReactionSelect}
                setReplyingTo={setReplyingTo}
              />
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur border-t border-muted p-4 z-20">
            <AnimatePresence>
              {replyingTo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="max-w-4xl mx-auto mb-2 p-2 bg-surface border-l-2 border-accent flex items-center justify-between rounded-r"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] text-accent uppercase font-bold tracking-widest">Replying to &lt;{replyingTo.senderAlias}&gt;</span>
                    <span className="text-xs text-text-main truncate max-w-md">{replyingTo.text}</span>
                  </div>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="text-muted hover:text-white p-1"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary">
                  <span className="font-mono font-bold">&gt;</span>
                </div>
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-surface border border-muted text-white font-mono text-sm rounded focus:ring-1 focus:ring-primary focus:border-primary block pl-8 p-3 transition-colors placeholder:text-muted/70"
                  placeholder="TRANSMIT MESSAGE..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-[10px] text-muted font-mono uppercase border border-muted/50 px-1 rounded">Enter</span>
                </div>
              </div>
              <button 
                type="submit"
                className="bg-primary hover:bg-primary/80 text-background-dark font-bold px-6 rounded transition-colors flex items-center justify-center shadow-neon-primary"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </main>

        <aside className="w-[240px] shrink-0 border-l border-muted bg-surface flex flex-col hidden lg:flex">
          <div className="p-6 border-b border-muted/50 flex flex-col items-center justify-center bg-surface relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,85,0.05)_0%,transparent_70%)]"></div>
            <h3 className="text-muted text-[10px] uppercase tracking-[0.2em] mb-2 font-bold z-10">Time to Live</h3>
            <div className="text-4xl font-mono font-bold text-danger shadow-neon-danger inline-block tracking-tighter z-10">
              {formatTtl(room.ttl)}
            </div>
            <div className="w-full bg-surface border border-danger/30 h-2 mt-4 rounded-full overflow-hidden z-10">
              <div className="bg-danger h-full w-[8%]" style={{ boxShadow: '0 0 8px #FF0055' }}></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-4 pb-2 flex justify-between items-center sticky top-0 bg-surface z-10">
              <h3 className="text-muted text-xs uppercase font-bold tracking-widest">Local Nodes</h3>
              <span className="text-accent font-mono text-xs border border-accent/30 px-1.5 py-0.5 rounded bg-accent/10">{members.length}</span>
            </div>
            <ul className="p-2 space-y-1 font-mono text-sm">
              {members.map((member) => (
                <li key={member.id}>
                  <div className={`flex items-center gap-2 p-2 rounded hover:bg-surface/80 transition-colors ${member.alias === userAlias ? 'bg-surface border border-muted' : 'text-text-main'}`}>
                    <div className={`w-2 h-2 rounded-full ${
                      member.status === 'online' ? 'bg-primary animate-pulse shadow-neon-primary' : 
                      member.status === 'away' ? 'bg-yellow-500' : 'bg-danger'
                    }`}></div>
                    <span className={`${member.alias === userAlias ? 'text-white font-bold' : 'text-accent'} flex-1`}>{member.alias}</span>
                    {member.alias === userAlias && <span className="text-muted text-[10px]">(YOU)</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 border-t border-muted/50 bg-background-dark/50">
            <div className="text-[10px] text-muted font-mono mb-2 uppercase text-center">Current Alias</div>
            <button 
              onClick={onScramble}
              className="w-full py-2 border border-accent text-accent hover:bg-accent/10 transition-colors font-mono text-sm rounded flex items-center justify-center gap-2"
            >
              <Shuffle size={16} />
              {userAlias}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
