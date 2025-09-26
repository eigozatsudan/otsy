import type { Meta, StoryObj } from '@storybook/react';
import { OrderCard } from './order-card';

const meta: Meta<typeof OrderCard> = {
  title: 'Business/OrderCard',
  component: OrderCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
  { id: '1', name: 'りんご', quantity: 3, price: 150 },
  { id: '2', name: 'バナナ', quantity: 2, price: 200 },
  { id: '3', name: '牛乳', quantity: 1, price: 250 },
];

export const Pending: Story = {
  args: {
    id: 'order-123456789',
    customerName: '田中太郎',
    status: 'pending',
    total: 1200,
    items: sampleItems,
    createdAt: new Date().toISOString(),
    deliveryAddress: '東京都渋谷区神南1-1-1',
    estimatedDelivery: '2024年1月15日 14:00-16:00',
  },
};

export const Accepted: Story = {
  args: {
    id: 'order-123456789',
    customerName: '田中太郎',
    status: 'accepted',
    total: 1200,
    items: sampleItems,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    deliveryAddress: '東京都渋谷区神南1-1-1',
    estimatedDelivery: '2024年1月15日 14:00-16:00',
    shopperName: '佐藤花子',
    showShopper: true,
  },
};

export const Shopping: Story = {
  args: {
    id: 'order-123456789',
    customerName: '田中太郎',
    status: 'shopping',
    total: 1200,
    items: sampleItems,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    deliveryAddress: '東京都渋谷区神南1-1-1',
    estimatedDelivery: '2024年1月15日 14:00-16:00',
    shopperName: '佐藤花子',
    showShopper: true,
  },
};

export const Delivered: Story = {
  args: {
    id: 'order-123456789',
    customerName: '田中太郎',
    status: 'delivered',
    total: 1200,
    items: sampleItems,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    deliveryAddress: '東京都渋谷区神南1-1-1',
    shopperName: '佐藤花子',
    showShopper: true,
  },
};

export const ManyItems: Story = {
  args: {
    id: 'order-123456789',
    customerName: '田中太郎',
    status: 'pending',
    total: 3500,
    items: [
      { id: '1', name: 'りんご', quantity: 3, price: 150 },
      { id: '2', name: 'バナナ', quantity: 2, price: 200 },
      { id: '3', name: '牛乳', quantity: 1, price: 250 },
      { id: '4', name: 'パン', quantity: 2, price: 300 },
      { id: '5', name: '卵', quantity: 1, price: 400 },
      { id: '6', name: 'チーズ', quantity: 1, price: 500 },
    ],
    createdAt: new Date().toISOString(),
    deliveryAddress: '東京都渋谷区神南1-1-1',
  },
};