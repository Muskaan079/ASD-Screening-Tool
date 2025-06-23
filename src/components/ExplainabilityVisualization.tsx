import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ExplainabilityData } from '../types';
import './ExplainabilityVisualization.css';

interface ExplainabilityVisualizationProps {
  data: ExplainabilityData;
  width?: number;
  height?: number;
}

const ExplainabilityVisualization: React.FC<ExplainabilityVisualizationProps> = ({
  data,
  width = 800,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data && svgRef.current) {
      renderVisualizations();
    }
  }, [data, width, height]);

  const renderVisualizations = () => {
    if (!svgRef.current || !data) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    
    // Create feature importance bar chart
    renderFeatureImportance(svg);
    
    // Create attention weights visualization
    renderAttentionWeights(svg);
    
    // Create confidence heatmap
    renderConfidenceHeatmap(svg);
    
    // Create decision path
    renderDecisionPath(svg);
  };

  const renderFeatureImportance = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width / 2 - margin.left - margin.right;
    const chartHeight = height / 2 - margin.top - margin.bottom;

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Prepare data
    const featureData = Object.entries(data.featureImportance).map(([feature, importance]) => ({
      feature,
      importance
    }));

    // Scales
    const xScale = d3.scaleBand()
      .domain(featureData.map(d => d.feature))
      .range([0, chartWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(featureData, d => d.importance) || 1])
      .range([chartHeight, 0]);

    // Color scale
    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(featureData, d => d.importance) || 1])
      .interpolator(d3.interpolateBlues);

    // Add bars
    chart.selectAll('.bar')
      .data(featureData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.feature) || 0)
      .attr('y', d => yScale(d.importance))
      .attr('width', xScale.bandwidth())
      .attr('height', d => chartHeight - yScale(d.importance))
      .attr('fill', d => colorScale(d.importance))
      .attr('rx', 4);

    // Add value labels
    chart.selectAll('.bar-label')
      .data(featureData)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => (xScale(d.feature) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.importance) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text(d => d.importance.toFixed(2));

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    chart.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    chart.append('g')
      .call(yAxis);

    // Add title
    chart.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Feature Importance');
  };

  const renderAttentionWeights = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width / 2 - margin.left - margin.right;
    const chartHeight = height / 2 - margin.top - margin.bottom;

    const chart = svg.append('g')
      .attr('transform', `translate(${width / 2 + margin.left}, ${margin.top})`);

    // Prepare data
    const attentionData = data.attentionWeights.map((weight, index) => ({
      index,
      weight
    }));

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, attentionData.length - 1])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(attentionData, d => d.weight) || 1])
      .range([chartHeight, 0]);

    // Color scale
    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(attentionData, d => d.weight) || 1])
      .interpolator(d3.interpolateReds);

    // Add line
    const line = d3.line<{index: number, weight: number}>()
      .x(d => xScale(d.index))
      .y(d => yScale(d.weight))
      .curve(d3.curveMonotoneX);

    chart.append('path')
      .datum(attentionData)
      .attr('fill', 'none')
      .attr('stroke', '#e74c3c')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add points
    chart.selectAll('.attention-point')
      .data(attentionData)
      .enter()
      .append('circle')
      .attr('class', 'attention-point')
      .attr('cx', d => xScale(d.index))
      .attr('cy', d => yScale(d.weight))
      .attr('r', 6)
      .attr('fill', d => colorScale(d.weight))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    chart.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis);

    chart.append('g')
      .call(yAxis);

    // Add title
    chart.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Attention Weights');
  };

  const renderConfidenceHeatmap = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width / 2 - margin.left - margin.right;
    const chartHeight = height / 2 - margin.top - margin.bottom;

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${height / 2 + margin.top})`);

    // Prepare data
    const heatmapData: Array<{row: number, col: number, value: number}> = [];
    data.confidenceHeatmap.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        heatmapData.push({ row: rowIndex, col: colIndex, value });
      });
    });

    // Scales
    const xScale = d3.scaleBand()
      .domain(d3.range(data.confidenceHeatmap[0]?.length || 0).map(String))
      .range([0, chartWidth])
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(d3.range(data.confidenceHeatmap.length).map(String))
      .range([0, chartHeight])
      .padding(0.1);

    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(heatmapData, d => d.value) || 1])
      .interpolator(d3.interpolateBlues);

    // Add heatmap cells
    chart.selectAll('.heatmap-cell')
      .data(heatmapData)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => xScale(d.col.toString()) || 0)
      .attr('y', d => yScale(d.row.toString()) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Add value labels
    chart.selectAll('.heatmap-label')
      .data(heatmapData)
      .enter()
      .append('text')
      .attr('class', 'heatmap-label')
      .attr('x', d => (xScale(d.col.toString()) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => (yScale(d.row.toString()) || 0) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('fill', d => d.value > 0.5 ? '#fff' : '#333')
      .text(d => d.value.toFixed(2));

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    chart.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis);

    chart.append('g')
      .call(yAxis);

    // Add title
    chart.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Confidence Heatmap');
  };

  const renderDecisionPath = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width / 2 - margin.left - margin.right;
    const chartHeight = height / 2 - margin.top - margin.bottom;

    const chart = svg.append('g')
      .attr('transform', `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);

    // Prepare data
    const pathData = data.decisionPath.map((step, index) => ({
      step,
      index
    }));

    // Scales
    const xScale = d3.scaleBand()
      .domain(pathData.map(d => d.step))
      .range([0, chartWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, pathData.length - 1])
      .range([0, chartHeight]);

    // Add nodes
    chart.selectAll('.decision-node')
      .data(pathData)
      .enter()
      .append('circle')
      .attr('class', 'decision-node')
      .attr('cx', d => (xScale(d.step) || 0) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.index))
      .attr('r', 8)
      .attr('fill', '#3498db')
      .attr('stroke', '#2980b9')
      .attr('stroke-width', 2);

    // Add connections
    for (let i = 0; i < pathData.length - 1; i++) {
      const current = pathData[i];
      const next = pathData[i + 1];
      
      chart.append('line')
        .attr('x1', (xScale(current.step) || 0) + xScale.bandwidth() / 2)
        .attr('y1', yScale(current.index))
        .attr('x2', (xScale(next.step) || 0) + xScale.bandwidth() / 2)
        .attr('y2', yScale(next.index))
        .attr('stroke', '#95a5a6')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');
    }

    // Add arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#95a5a6');

    // Add labels
    chart.selectAll('.decision-label')
      .data(pathData)
      .enter()
      .append('text')
      .attr('class', 'decision-label')
      .attr('x', d => (xScale(d.step) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.index) + 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .text(d => d.step);

    // Add title
    chart.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Decision Path');
  };

  return (
    <div className="explainability-visualization">
      <div className="visualization-header">
        <h3>Model Explainability</h3>
        <p>Understanding how the AI model makes decisions</p>
        <div className="model-info">
          <span>Model Version: {data.modelVersion}</span>
        </div>
      </div>
      
      <div className="visualization-container" ref={chartRef}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="explainability-svg"
        />
      </div>
      
      <div className="explainability-summary">
        <div className="summary-item">
          <h4>Feature Importance</h4>
          <p>Shows which input features most influence the model's decisions</p>
        </div>
        <div className="summary-item">
          <h4>Attention Weights</h4>
          <p>Indicates which parts of the input the model focuses on</p>
        </div>
        <div className="summary-item">
          <h4>Confidence Heatmap</h4>
          <p>Visualizes the model's confidence across different input regions</p>
        </div>
        <div className="summary-item">
          <h4>Decision Path</h4>
          <p>Shows the step-by-step reasoning process of the model</p>
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityVisualization; 