import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

// A basic implementation of toBeInTheDocument for environments without a full setup
expect.extend({
  toBeInTheDocument(received) {
    const pass = received ? document.body.contains(received) : false;
    return {
      message: () => `expected ${received} to be in the document`,
      pass,
    };
  },
});

describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles onClick events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies the correct variant class', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild?.classList.contains('bg-destructive')).toBe(true);
  });

  it('is disabled when the disabled prop is true', () => {
    const handleClick = vi.fn();
    const { getByText } = render(<Button onClick={handleClick} disabled>Disabled</Button>);
    const button = getByText('Disabled') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
