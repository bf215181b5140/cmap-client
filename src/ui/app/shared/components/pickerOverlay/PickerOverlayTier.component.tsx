import styled from "styled-components";
import React from "react";
import Icon from 'cmap2-shared/src/react/components/icon.component';
import { ReactProps, TierDto } from 'cmap2-shared';

interface PickerOverlayTierProps extends ReactProps {
    tier: TierDto;
}

export default function PickerOverlayTier({ tier }: PickerOverlayTierProps) {

    return (<PickerOverlayTierStyled>
        <Icon icon='ri-medal-fill' color={tier.color} />
        {tier.tier}
    </PickerOverlayTierStyled>);
}

const PickerOverlayTierStyled = styled.div`
  position: absolute;
  top: 0.5em;
  left: 0.5em;
  font-size: 1em;
  background: ${props => props.theme.colors.buttonPrimary.bg};
  padding: 0.3em 0.5em;
  border-radius: 0.5em;
  border: 1px solid ${props => props.theme.colors.buttonPrimary.border};
  text-transform: capitalize;
`;
