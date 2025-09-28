'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  PaperAirplaneIcon,
  PhotoIcon,
  PaperClipIcon,
  XMarkIcon,
  UserIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore } from '@/store/orders';
import { useAuthStore } from '@/store/auth';
import { chatApi } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatRelativeTime, formatTime } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useSocket } from '@/hooks/useSocket';

interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: 'user' | 'shopper';
  message: string;
  attachments?: string[];
  createdAt: string;
  isRead: boolean;
}

interface ChatRoom {
  orderId: string;
  orderNumber: string;
  shopperName: string;
  lastMessage?: Message;
  unreadCount: number;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const selectedOrderId = searchParams.get('order');
  
  const { user } = useAuthStore();
  const { orders, fetchOrders } = useOrdersStore();
  const { socket, isConnected } = useSocket();
  
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(selectedOrderId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch orders with active chats
  useEffect(() => {
    fetchOrders({ 
      limit: 50 
    });
  }, [fetchOrders]);

  // Create chat rooms from orders
  useEffect(() => {
    const activeOrders = orders?.filter(order => 
      ['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase()) &&
      order.shopper
    ) || [];

    const rooms: ChatRoom[] = activeOrders.map(order => ({
      orderId: order.id,
      orderNumber: `#${order.id.slice(-8)}`,
      shopperName: `${order.shopper!.lastName} ${order.shopper!.firstName}`,
      unreadCount: 0, // This would come from API
    }));

    setChatRooms(rooms);

    // Auto-select room if specified in URL
    if (selectedOrderId && rooms.find(room => room.orderId === selectedOrderId)) {
      setSelectedRoom(selectedOrderId);
    } else if (rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].orderId);
    }
  }, [orders, selectedOrderId, selectedRoom]);

  // Fetch messages for selected room and join chat
  useEffect(() => {
    if (selectedRoom && socket && isConnected) {
      loadMessages(selectedRoom);
      // Join the chat room for real-time updates
      socket.emit('join_chat', { chatId: selectedRoom });
    }
  }, [selectedRoom, socket, isConnected]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      console.log('New message received:', message);
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const handleJoinChat = (data: { chatId: string; userId: string }) => {
      console.log('Joined chat:', data);
    };

    const handleLeaveChat = (data: { chatId: string; userId: string }) => {
      console.log('Left chat:', data);
    };

    const handleError = (error: any) => {
      console.error('Socket error:', error);
      toast.error('接続エラーが発生しました');
    };

    // Listen for new messages
    socket.on('new_message', handleNewMessage);
    socket.on('join_chat', handleJoinChat);
    socket.on('leave_chat', handleLeaveChat);
    socket.on('error', handleError);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('join_chat', handleJoinChat);
      socket.off('leave_chat', handleLeaveChat);
      socket.off('error', handleError);
    };
  }, [socket]);

  const loadMessages = async (orderId: string) => {
    try {
      setIsLoading(true);
      const response = await chatApi.getOrderMessages(orderId);
      
      // Handle both array format (legacy) and object format (new)
      const messagesData = Array.isArray(response) ? response : response.messages || [];
      setMessages(messagesData);
      
      // Mark messages as read
      await chatApi.markMessagesAsRead(orderId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('メッセージの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoom || (!newMessage.trim() && attachments.length === 0)) {
      return;
    }

    try {
      setIsSending(true);
      
      console.log('Sending message:', {
        orderId: selectedRoom,
        message: newMessage,
        attachments: attachments.length
      });
      
      const message = await chatApi.sendMessage(
        selectedRoom,
        newMessage,
        attachments.length > 0 ? attachments : undefined
      );

      console.log('Message sent successfully:', message);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setAttachments([]);
      
      toast.success('メッセージを送信しました');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('メッセージの送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        toast.error(`${file.name}: 画像またはPDFファイルのみアップロード可能です`);
        return false;
      }
      
      if (!isValidSize) {
        toast.error(`${file.name}: ファイルサイズは10MB以下にしてください`);
        return false;
      }
      
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const selectedRoomData = chatRooms.find(room => room.orderId === selectedRoom);

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Chat rooms sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">チャット</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? '接続中' : '切断中'}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">ショッパーとのやり取り</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatRooms.length > 0 ? (
            <div className="space-y-1 p-2">
              {chatRooms.map((room) => (
                <button
                  key={room.orderId}
                  onClick={() => setSelectedRoom(room.orderId)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedRoom === room.orderId
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">
                      注文 {room.orderNumber}
                    </span>
                    {room.unreadCount > 0 && (
                      <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {room.shopperName}
                  </p>
                  {room.lastMessage && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {room.lastMessage.message}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                アクティブな注文がありません
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                注文を作成するとショッパーとチャットできます
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom && selectedRoomData ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    注文 {selectedRoomData.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {selectedRoomData.shopperName}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  オンライン
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      
                      {message.attachment_url && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs">
                            <a
                              href={message.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              添付ファイル
                            </a>
                          </div>
                        </div>
                      )}
                      
                      <p className={`text-xs mt-1 ${
                        message.sender_role === 'user' ? 'text-primary-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">まだメッセージがありません</p>
                  <p className="text-sm text-gray-400 mt-1">
                    ショッパーとのやり取りを開始しましょう
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200">
              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 rounded-lg px-3 py-2 text-sm"
                    >
                      <PhotoIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="truncate max-w-32">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>

                <button
                  type="submit"
                  disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
                  className="btn-primary p-2 disabled:opacity-50"
                >
                  {isSending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <PaperAirplaneIcon className="h-5 w-5" />
                  )}
                </button>
              </form>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                チャットを選択してください
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                左側から注文を選択してショッパーとチャットを開始
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}