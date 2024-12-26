import { Flex, useMantineTheme } from "@mantine/core";
import type { OutputFieldDisplayProps } from "../OutputFieldDisplay";
import { TextOutput } from "./BasicOutputs";
import React, { useCallback, useMemo, useRef } from 'react';
import { scaleLinear } from '@visx/scale';
import { LinePath, Circle } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { extent } from 'd3-array';
import { withTooltip, Tooltip, WithTooltipProvidedProps } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { voronoi } from '@visx/voronoi';

type Point = [number, number];

const PolylineOutputWithTooltip = withTooltip<OutputFieldDisplayProps, Point>(
  ({
    field,
    expanded,
    hideTooltip,
    showTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft,
    tooltipTop,
  }: OutputFieldDisplayProps & WithTooltipProvidedProps<Point>) => {
    const theme = useMantineTheme();

    if (!expanded) {
      return <TextOutput field={field} expanded={expanded} />;
    }

    if (!field.data || !field.data.points || !Array.isArray(field.data.points)) {
      return (
        <Flex
          w='100%'
          mih='29px'
          h='auto'
          px='0.5rem'
          bg='dark.6' 
          align='center'
          justify='center'
          className="nodrag"
          style={{
            border: `1px solid ${theme.colors.dark[4]}`, 
            borderRadius: '0.25rem',
            color: theme.colors.dark[2]
          }}
        >
          No valid data available for visualization
        </Flex>
      );
    }

    const width = 300;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    const svgRef = useRef<SVGSVGElement>(null);

    const xScale = useMemo(() => {
      const domain = extent(field.data.points, d => d[0]) as [number, number];
      return scaleLinear({
        domain,
        range: [0, xMax],
        nice: true,
      });
    }, [field.data.points, xMax]);

    const yScale = useMemo(() => {
      const domain = extent(field.data.points, d => d[1]) as [number, number];
      return scaleLinear({
        domain,
        range: [yMax, 0],
        nice: true,
      });
    }, [field.data.points, yMax]);

    const voronoiLayout = useMemo(
      () =>
        voronoi<Point>({
          x: (d) => xScale(d[0]) ?? 0,
          y: (d) => yScale(d[1]) ?? 0,
          width: xMax,
          height: yMax,
        })(field.data.points),
      [xMax, yMax, xScale, yScale, field.data.points],
    );

    const handleMouseMove = useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        if (!svgRef.current) return;

        const point = localPoint(svgRef.current, event);
        if (!point) return;
        const neighborRadius = 100;
        const closest = voronoiLayout.find(point.x - margin.left, point.y - margin.top, neighborRadius);
        if (closest) {
          showTooltip({
            tooltipLeft: xScale(closest.data[0]) + margin.left,
            tooltipTop: yScale(closest.data[1]) + margin.top,
            tooltipData: closest.data,
          });
        }
      },
      [xScale, yScale, showTooltip, voronoiLayout, margin]
    );

    const handleMouseLeave = useCallback(() => {
      hideTooltip();
    }, [hideTooltip]);

    return (
      <Flex
        w='100%'
        mih='29px'
        h='auto'
        px='0.5rem'
        bg='dark.6' 
        align='center'
        className="nodrag"
        style={{
          border: `1px solid ${theme.colors.dark[4]}`, 
          borderRadius: '0.25rem',
          textOverflow: 'clip',
          userSelect: 'text',
          cursor: 'text'
        }}
      >
        <div style={{ width: '100%', height: '300px', position: 'relative' }}>
          <svg width={width} height={height} ref={svgRef}>
            <rect
              x={margin.left}
              y={margin.top}
              width={xMax}
              height={yMax}
              fill="transparent"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseLeave}
            />
            <Group left={margin.left} top={margin.top}>
              <AxisBottom
                scale={xScale}
                top={yMax}
                stroke={theme.colors.dark[2]}
                tickStroke={theme.colors.dark[2]}
              />
              <AxisLeft
                scale={yScale}
                stroke={theme.colors.dark[2]}
                tickStroke={theme.colors.dark[2]}
              />
              <LinePath
                data={field.data.points}
                x={d => xScale(d[0])}
                y={d => yScale(d[1])}
                stroke={theme.colors.blue[6]}
                strokeWidth={1.5}
              />
              {field.data.points.map((point, i) => (
                <Circle
                  key={i}
                  cx={xScale(point[0])}
                  cy={yScale(point[1])}
                  r={4}
                  fill={tooltipData === point ? 'white' : theme.colors.blue[6]}
                />
              ))}
            </Group>
          </svg>
          {tooltipOpen && tooltipData && tooltipLeft != null && tooltipTop != null && (
            <Tooltip left={tooltipLeft + 10} top={tooltipTop + 10}>
              <div>
                <strong>X:</strong> {tooltipData[0].toFixed(2)}
              </div>
              <div>
                <strong>Y:</strong> {tooltipData[1].toFixed(2)}
              </div>
            </Tooltip>
          )}
        </div>
      </Flex>
    );
  }
);

export const PolylineOutput = (props: OutputFieldDisplayProps) => <PolylineOutputWithTooltip {...props} />;