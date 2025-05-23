import { Link, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';

interface ContentMenuLinkProps {
  to: string;
  icon: string;
  disabled?: boolean;
  tooltip?: string;
  attention?: boolean;
}

export default function ContentMenuLink({ to, icon, disabled = false, tooltip, attention = false }: ContentMenuLinkProps) {

  const pathname = useLocation().pathname;

  function isCurrentPath(): boolean {
    return pathname.indexOf(to) === 0;
  }

  return (<ContentMenuLinkStyled to={to} $isActive={isCurrentPath()} disabled={disabled}>
    <i className={icon} />
    {tooltip && <div className={'tooltip'}>{tooltip}</div>}
    {attention && <i className={'ri-circle-fill attention'}></i>}
  </ContentMenuLinkStyled>);
}

const highlight = css`
  background-color: ${props => props.theme.colors.contentMenu.hoverBg};
  border-color: ${props => props.theme.colors.contentMenu.hoverBorder};

  i {
    color: ${props => props.theme.colors.contentMenu.hoverIcon};
  }
`;

const ContentMenuLinkStyled = styled(Link)<{ $isActive: boolean, disabled: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  background-color: ${props => props.theme.colors.contentMenu.bg};
  border: 2px solid ${props => props.theme.colors.contentMenu.border};
  transition: 0.1s linear;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 7px;
  position: relative;

  i {
    font-size: 24px;
    display: block;
    color: ${props => props.theme.colors.contentMenu.icon};
  }

  .tooltip {
    display: none;
    position: fixed;
    left: 76px;
    text-shadow: 0 0 5px ${props => props.theme.colors.ui.appBgOpaque};
    background: #111;
    padding: 4px 12px;
    border-radius: 8px;
    color: ${props => props.theme.colors.font.text};
    font-weight: normal;
  }

  .attention {
    color: ${props => props.theme.colors.attention};
    font-size: 10px;
    position: absolute;
    top: 4px;
    right: 5px;
  }

  ${props => props.$isActive ? highlight : null};

  :hover {
    ${highlight};

    .tooltip {
      animation: ContentMenuLinkTooltip 150ms;
      display: block;
    }

    .attention {
      color: ${props => props.theme.colors.attention};
    }
  }

  &[disabled] {
    pointer-events: none;
    filter: saturate(0%);
  }

  @keyframes ContentMenuLinkTooltip {
    from {
      left: 40px;
      opacity: 0;
    }
    to {
      left: 76px;
      opacity: 1;
    }
  }
`;
