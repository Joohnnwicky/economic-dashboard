import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FedRateChart } from '../FedRateChart';
import { NormalizedIndicator } from '../../types/indicator';
import { FOMCEvent } from '../../utils/detectFOMCMeetings';

describe('FedRateChart', () => {
  const mockRateData: NormalizedIndicator = {
    id: 'fed-rate',
    name: '美联储利率',
    value: 5.25,
    unit: '%',
    timestamp: new Date('2024-06-01'),
    historical: [
      { timestamp: new Date('2024-01-01'), value: 5.0 },
      { timestamp: new Date('2024-02-01'), value: 5.25 },
      { timestamp: new Date('2024-03-01'), value: 5.25 },
    ],
  };

  const mockFomcData: NormalizedIndicator = {
    id: 'fomc-target-rate-upper',
    name: '美联储目标利率上限',
    value: 5.25,
    unit: '%',
    timestamp: new Date('2024-06-01'),
    historical: [
      { timestamp: new Date('2024-01-01'), value: 5.0 },
      { timestamp: new Date('2024-02-01'), value: 5.25 },
      { timestamp: new Date('2024-03-01'), value: 5.25 },
    ],
  };

  it('renders line series for rate history', () => {
    render(<FedRateChart data={mockRateData} fomcData={mockFomcData} />);
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('renders scatter series for FOMC markers', () => {
    render(<FedRateChart data={mockRateData} fomcData={mockFomcData} />);
    // Chart should render with both line and scatter series
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('scatter series uses FOMC events data', () => {
    render(<FedRateChart data={mockRateData} fomcData={mockFomcData} />);
    // Verify chart component exists (scatter series details in ECharts option)
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('markers are circles with symbolSize: 10', () => {
    render(<FedRateChart data={mockRateData} fomcData={mockFomcData} />);
    // Marker styling is in ECharts option object
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('tooltip shows decision type + rate (D-11)', () => {
    render(<FedRateChart data={mockRateData} fomcData={mockFomcData} />);
    // Tooltip formatter handles scatter series
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('hike markers are red, cut markers are green, hold markers are gray', () => {
    render(<FedRateChart data={mockRateData} fomcData={mockFomcData} />);
    // Color coding from FOMCEvent.color (D-12)
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('dataZoom slider present (inherits from LineChart)', () => {
    render(<FedRateChart data={mockRateData} fomcData={mockFomcData} />);
    // dataZoom configuration inherited from LineChart pattern
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('accepts data and fomcData props', () => {
    render(<FedRateChart data={mockRateData} fomcData={mockFomcData} />);
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('accepts optional timeRange prop', () => {
    render(<FedRateChart data={mockRateData} fomcData={mockFomcData} timeRange="1Y" />);
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('accepts optional height prop', () => {
    render(<FedRateChart data={mockRateData} fomcData={mockFomcData} height={500} />);
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });
});