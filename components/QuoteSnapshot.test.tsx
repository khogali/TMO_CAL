import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuoteSnapshot from './QuoteSnapshot';
import { QuoteConfig } from '../types';
import { createInitialConfig, INITIAL_PLANS, INITIAL_SERVICE_PLANS, INITIAL_INSURANCE_PLANS, INITIAL_PROMOTIONS, INITIAL_DEVICE_DATABASE } from '../constants';
import { calculateQuoteTotals } from '../utils/calculations';

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

// Mock data
const mockConfig: QuoteConfig = {
    ...createInitialConfig(INITIAL_PLANS),
    customerName: 'Jane Doe',
    lines: 2,
};

const mockTotals = calculateQuoteTotals(
    mockConfig, 
    INITIAL_PLANS, 
    INITIAL_SERVICE_PLANS, 
    { autopay: 5, insider: 20, thirdLineFree: 0 }, 
    INITIAL_INSURANCE_PLANS, 
    INITIAL_PROMOTIONS,
    INITIAL_DEVICE_DATABASE
);

if (!mockTotals) {
  throw new Error("Mock totals failed to calculate");
}


describe('QuoteSnapshot component', () => {
    // Note: Wrapping with AppProvider is not needed here as QuoteSnapshot will be refactored
    // to get its props directly for easier testing, or we can mock the context.
    // For now, we pass props directly.

    it('renders the calculating state when totals are null', () => {
        render(<QuoteSnapshot mode="simple" config={mockConfig} totals={null} />);
        expect(screen.getByText('Calculating your quote...')).toBeInTheDocument();
    });

    it('renders the correct monthly and due today totals', () => {
        render(<QuoteSnapshot mode="full" config={mockConfig} totals={mockTotals} />);
        
        // From calculation: Plan $180 - Autopay $10 = $170. Tax is included.
        expect(screen.getByText('$170.00')).toBeInTheDocument(); // Monthly total
        expect(screen.getByText('$0.00')).toBeInTheDocument(); // Due today total
    });

    it('shows the customer name in full mode', () => {
        render(<QuoteSnapshot mode="full" config={mockConfig} totals={mockTotals} />);
        expect(screen.getByText('Quote for Jane Doe')).toBeInTheDocument();
    });

    it('hides the customer name in simple mode', () => {
        render(<QuoteSnapshot mode="simple" config={mockConfig} totals={mockTotals} />);
        expect(screen.getByText('Quote Summary')).toBeInTheDocument();
        expect(screen.queryByText('Quote for Jane Doe')).not.toBeInTheDocument();
    });

    it('shows the "Save Lead" button in full mode and calls onSave when clicked', () => {
        const handleSave = vi.fn();
        render(<QuoteSnapshot mode="full" config={mockConfig} totals={mockTotals} onSave={handleSave} />);
        
        const saveButton = screen.getByText('Save Lead');
        expect(saveButton).toBeInTheDocument();
        
        fireEvent.click(saveButton);
        expect(handleSave).toHaveBeenCalledTimes(1);
    });

    it('hides the "Save Lead" button in simple mode', () => {
        render(<QuoteSnapshot mode="simple" config={mockConfig} totals={mockTotals} />);
        expect(screen.queryByText('Save Lead')).not.toBeInTheDocument();
    });
});
