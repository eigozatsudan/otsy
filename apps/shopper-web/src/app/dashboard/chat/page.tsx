'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  PaperAirplaneIcon,
  PhotoIcon,
  PaperClipIcon,
  XMarkIcon,
  UserIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useOrdersStore } from '@/store/orders';
import { useAuthStore } from '@/store/auth';
import { chatApi } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatRelativeTime, formatTime } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

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
  customerName: string;
  lastMessage?: Message;
  unreadCount: number;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const selectedOrderId = searchParams?.get('order') || null;
  
  const { user } = useAuthStore();
  const { myOrders, fetchMyOrders } = useOrdersStore();
  
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
    const loadOrders = async () => {
      try {
        await fetchMyOrders();
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };
    
    loadOrders();
  }, [fetchMyOrders]);

  // Create chat rooms from orders
  useEffect(() => {
    const activeOrders = myOrders?.filter(order => 
      ['accepted', 'shopping', 'enroute'].includes(order.status.toLowerCase()) &&
      order.user
    ) || [];

    const rooms: ChatRoom[] = activeOrders.map(order => ({
      orderId: order.id,
      orderNumber: `#${order.id.slice(-8)}`,
      customerName: `${order.user!.lastName} ${order.user!.firstName}`,
      unreadCount: 0, // This would come from API
    }));

    setChatRooms(rooms);

    // Auto-select room if specified in URL
    if (selectedOrderId && rooms.find(room => room.orderId === selectedOrderId)) {
      setSelectedRoom(selectedOrderId);
    } else if (rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].orderId);
    }
  }, [myOrders, selectedOrderId, selectedRoom]);

  // Fetch messages for selected room
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom);
    }
  }, [selectedRoom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      
      const message = await chatApi.sendMessage(
        selectedRoom,
        newMessage,
        attachments.length > 0 ? attachments : undefined
      );

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
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const selectedRoomData = chatRooms.find(room => room.orderId === selectedRoom);

  // Show loading state while fetching orders
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Rooms Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">チャット</h2>
            <p className="text-sm text-gray-500">
              {chatRooms.length}件のアクティブな注文
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatRooms.length === 0 ? (
              <div className="p-4 text-center">
                <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  アクティブなチャットがありません
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  進行中の注文でチャットが開始されます
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {chatRooms.map((room) => (
                  <button
                    key={room.orderId}
                    onClick={() => setSelectedRoom(room.orderId)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedRoom === room.orderId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {room.customerName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {room.orderNumber}
                          </p>
                        </div>
                      </div>
                      {room.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                    {room.lastMessage && (
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {room.lastMessage.message}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedRoomData?.customerName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedRoomData?.orderNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoading ? (
                  <div className="flex justify-center">
                    <LoadingSpinner />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      まだメッセージがありません
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      お客様との会話を始めましょう
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_role === 'shopper' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_role === 'shopper'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.attachment_url && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs opacity-75">
                              📎 {message.attachment_url}
                            </div>
                          </div>
                        )}
                        <p className="text-xs mt-1 opacity-75">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                {attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2"
                      >
                        <PaperClipIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700 truncate max-w-32">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="メッセージを入力..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSending}
                    />
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    disabled={isSending}
                  >
                    <PaperClipIcon className="h-5 w-5" />
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  チャットルームを選択してください
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  左側のリストからチャットを開始する注文を選択してください
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
