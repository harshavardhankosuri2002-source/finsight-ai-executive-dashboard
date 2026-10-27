import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock Recharts ResponsiveContainer to avoid SVG measurement errors in jsdom
vi.mock('recharts', async () => {
  const original = await vi.importActual<any>('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 800, height: 400 }}>{children}</div>,
  };
});

describe('FinSight AI Frontend Application', () => {
  it('renders sidebar branding and navigation tabs', () => {
    render(<App />);
    expect(screen.getByText('FinSight')).toBeInTheDocument();
    expect(screen.getByText('Executive Overview')).toBeInTheDocument();
    expect(screen.getByText('KPI Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Driver Analysis')).toBeInTheDocument();
    expect(screen.getByText('Risk Monitor')).toBeInTheDocument();
    expect(screen.getByText('AI Executive Assistant')).toBeInTheDocument();
    expect(screen.getByText('Scenario Planner')).toBeInTheDocument();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('Executive Reports')).toBeInTheDocument();
  });

  it('renders executive decision intelligence header with business unit selector', () => {
    render(<App />);
    expect(screen.getByText('Executive Decision Intelligence')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
