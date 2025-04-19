import styled, { css } from 'styled-components';
import React from 'react';
import { TierDTO } from 'cmap-shared';
import Icon from '../icon/icon.component';

interface PickerOverlayTierProps {
  tier: TierDTO;
  valid?: boolean;
  position?: 'left' | 'right';
}

export default function PickerOverlayTier({ tier, valid = true, position = 'left' }: PickerOverlayTierProps) {

  return (<PickerOverlayTierStyled valid={valid} position={position}>
    <Icon className="ri-medal-fill" color={tier.color} />
    {tier.label}
  </PickerOverlayTierStyled>);
}

const PickerOverlayTierStyled = styled.div<{ valid?: boolean, position?: 'left' | 'right' }>`
  position: absolute;
  top: 8px;
  ${props => props.position === 'left' ? css`left: 8px;` : css`right: 8px;`}
  font-size: 14px;
  background: ${props => props.theme.colors.buttons.primary.bg};
  padding: 4px 6px;
  border-radius: 5px;
  border: 1px solid ${props => props.theme.colors.buttons.primary.border};
  text-transform: capitalize;
  color: ${props => props.valid ? props.theme.colors.font.text : props.theme.colors.error};
  pointer-events: none;
`;
