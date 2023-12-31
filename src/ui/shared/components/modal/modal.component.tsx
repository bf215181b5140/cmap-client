import React from 'react';
import { InputType, ReactProps } from 'cmap2-shared';
import styled from 'styled-components';
import colors from 'cmap2-shared/src/colors.json';
import { Icon } from 'cmap2-shared/dist/react';
import FormInput from '../form/formInput.component';
import { Modal } from './modal.hook';

export interface ModalComponentProps extends ReactProps {
    modal: Modal | null;
    clearModal: () => void;
}

export default function ModalComponent({ modal, clearModal }: ModalComponentProps) {

    function onClose() {
        clearModal();
    }

    function onConfirm() {
        modal?.confirmFunction.apply(null);
        clearModal()
    }

    if (!modal) {
        return null;
    }

    return (<ModalWrapper>
        <ModalStyled>
            <ModalTitle>
                <h2>{modal.title || 'Confirmation required'}</h2>
                <span onClick={onClose}><Icon icon="ri-close-line" /></span>
            </ModalTitle>
            <ModalContent>
                {modal.message || 'Confirm your action'}
                <div id='confirmation'>
                    <FormInput type={InputType.Button} value={modal.confirmValue || 'Confirm'} onClick={onConfirm} />
                </div>
            </ModalContent>
        </ModalStyled>
    </ModalWrapper>);
}

const ModalWrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
`;

const ModalStyled = styled.div`
  background-color: ${colors['content-bg']};
  border: 2px solid ${colors['app-border']};
  border-radius: 8px;
  min-width: 350px;
  max-width: 600px;
  min-height: 125px;
  max-height: 400px;
`;

const ModalTitle = styled.div`
  background-color: ${colors['input-bg']};
  border-bottom: 1px solid ${colors['app-border']};
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 8px;
  gap: 10px;

  h2 {
    margin: 0;
    padding: 0;
  }
  
  span {
    padding: 0 5px;
    font-size: 20px;
    display: block;
    cursor: pointer;
  }
`;

const ModalContent = styled.div`
  padding: 10px;
  
  #confirmation {
    margin-top: 10px;
    text-align: end;
  }
`;
