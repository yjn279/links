/**
 * Icon.tsx — Lucide-style monoline SVG icons
 * Mirrors design-spec/ui_kits/links-app/Icon.jsx, 20 icons.
 * API: <Icon name="bookmark" size={20} color="#1F1A14" stroke={1.85} />
 */
import React from 'react';
import Svg, {
  Circle,
  Path,
  Polygon,
  Polyline,
  Rect,
} from 'react-native-svg';

export type IconName =
  | 'bookmark'
  | 'bookmark-fill'
  | 'search'
  | 'plus'
  | 'menu'
  | 'clock'
  | 'star'
  | 'star-fill'
  | 'trending'
  | 'bell'
  | 'settings'
  | 'list'
  | 'grid'
  | 'archive'
  | 'link'
  | 'chevron-down'
  | 'x'
  | 'layers'
  | 'refresh'
  | 'more';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
};

export function Icon({ name, size = 20, color = '#1F1A14', stroke = 1.85 }: Props) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'bookmark':
      return (
        <Svg {...commonProps}>
          <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </Svg>
      );
    case 'bookmark-fill':
      return (
        <Svg {...commonProps} fill={color}>
          <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...commonProps}>
          <Circle cx="11" cy="11" r="7" />
          <Path d="m20 20-3.5-3.5" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...commonProps} strokeWidth={stroke + 0.4}>
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      );
    case 'menu':
      return (
        <Svg {...commonProps}>
          <Path d="M4 7h16M4 12h16M4 17h16" />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="10" />
          <Polyline points="12 6 12 12 16 14" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...commonProps}>
          <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </Svg>
      );
    case 'star-fill':
      return (
        <Svg {...commonProps} fill="#F5C518" stroke="#F5C518">
          <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </Svg>
      );
    case 'trending':
      return (
        <Svg {...commonProps}>
          <Polyline points="3 17 9 11 13 15 21 7" />
          <Polyline points="14 7 21 7 21 14" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...commonProps}>
          <Path d="M22 17a2 2 0 0 1-2 2H7l-5 4V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </Svg>
      );
    case 'list':
      return (
        <Svg {...commonProps}>
          <Path d="M3 7h18M3 12h18M3 17h18" />
        </Svg>
      );
    case 'grid':
      return (
        <Svg {...commonProps}>
          <Rect x="3" y="3" width="7" height="7" />
          <Rect x="14" y="3" width="7" height="7" />
          <Rect x="3" y="14" width="7" height="7" />
          <Rect x="14" y="14" width="7" height="7" />
        </Svg>
      );
    case 'archive':
      return (
        <Svg {...commonProps}>
          <Rect x="3" y="4" width="18" height="4" rx="2" />
          <Path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
          <Path d="M10 12h4" />
        </Svg>
      );
    case 'link':
      return (
        <Svg {...commonProps}>
          <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg {...commonProps} strokeWidth={stroke + 0.5}>
          <Polyline points="6 9 12 15 18 9" />
        </Svg>
      );
    case 'x':
      return (
        <Svg {...commonProps}>
          <Path d="M18 6 6 18M6 6l12 12" />
        </Svg>
      );
    case 'layers':
      return (
        <Svg {...commonProps}>
          <Path d="M12 2 2 7l10 5 10-5-10-5z" />
          <Path d="M2 17l10 5 10-5" />
          <Path d="M2 12l10 5 10-5" />
        </Svg>
      );
    case 'refresh':
      return (
        <Svg {...commonProps}>
          <Polyline points="23 4 23 10 17 10" />
          <Polyline points="1 20 1 14 7 14" />
          <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </Svg>
      );
    case 'more':
      return (
        <Svg {...commonProps}>
          <Circle cx="5" cy="12" r="1.5" />
          <Circle cx="12" cy="12" r="1.5" />
          <Circle cx="19" cy="12" r="1.5" />
        </Svg>
      );
    default:
      return null;
  }
}
