import React from 'react';
import Plot from 'react-plotly.js';
import type { ChartData } from '../../types';

interface DemandCapacityChartProps {
  chartData: ChartData;
  title?: string;
}

export const DemandCapacityChart: React.FC<DemandCapacityChartProps> = ({
  chartData,
  title
}) => {
  // Prepare data for Plotly
  const times = chartData.data.map(point => point.time);
  const capacityData = chartData.data.map(point => point.capacity);
  const demandData = chartData.data.map(point => point.demand);

  // Color mapping based on utilization
  const barColors = chartData.data.map(point => {
    const utilization = point.utilization;
    if (utilization >= 90) return '#dc2626'; // Red
    if (utilization >= 80) return '#ea580c'; // Orange
    if (utilization >= 60) return '#2563eb'; // Blue
    return '#059669'; // Green
  });

  // Plotly data configuration
  const plotData = [
    {
      x: times,
      y: capacityData,
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'Capacity',
      line: { color: '#059669', width: 3 },
      marker: { color: '#059669', size: 6 },
    },
    {
      x: times,
      y: demandData,
      type: 'bar' as const,
      name: 'Demand',
      marker: {
        color: barColors,
        line: { color: 'rgba(0,0,0,0.1)', width: 1 }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                    'Demand: %{y}<br>' +
                    'Utilization: %{customdata}%<br>' +
                    '<extra></extra>',
      customdata: chartData.data.map(point => point.utilization)
    }
  ];

  // Plotly layout configuration
  const layout = {
    width: 380,
    height: 180,
    margin: { l: 40, r: 20, t: 20, b: 40 },
    paper_bgcolor: 'rgba(255,255,255,0)',
    plot_bgcolor: 'rgba(255,255,255,0)',
    font: { color: '#1f2937', size: 12 },
    xaxis: {
      gridcolor: 'rgba(0,0,0,0.2)',
      tickfont: { size: 11, color: '#374151' },
      showgrid: true,
      zeroline: false
    },
    yaxis: {
      gridcolor: 'rgba(0,0,0,0.2)',
      tickfont: { size: 11, color: '#374151' },
      showgrid: true,
      zeroline: false
    },
    legend: {
      x: 0,
      y: 1,
      bgcolor: 'rgba(255,255,255,0)',
      font: { size: 11, color: '#1f2937' }
    },
    showlegend: true,
    hovermode: 'x unified' as const
  };

  // Plotly config
  const config = {
    displayModeBar: false,
    responsive: true,
    staticPlot: false
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
