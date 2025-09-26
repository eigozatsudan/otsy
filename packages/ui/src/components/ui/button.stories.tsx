import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
    loading: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'ボタン',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: '削除',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'アウトライン',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'セカンダリ',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'ゴースト',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'リンク',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: '小さいボタン',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: '大きいボタン',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: '読み込み中',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: '無効',
  },
};