import React, { useEffect, useState } from 'react';
import Segment from '../../../../components/segment/segment.component';
import SegmentTable from '../../../../components/segment/segmentTable.component';
import { TrackedParameter } from '../../../../../electron/trackedParameters/trackedParameters.model';
import { theme } from 'cmap-shared/react';
import AvatarName from '../../../../components/savedAvatar/savedAvatar.component';
import styled from 'styled-components';
import { useNotifications } from '../../../../hooks/useNotifications.hook';

export default function TrackedParameters() {

  const { addNotification } = useNotifications();
  const [trackedParameters, setTrackedParameters] = useState<Map<string, TrackedParameter>>(new Map());
  const [bufferFrequencyLimit, setSufferFrequencyLimit] = useState<number | undefined>();
  const [batchingActive, setBatchingActive] = useState<boolean>(false);
  const [parameterBlacklist, setParameterBlacklist] = useState<Set<string>>(new Set());
  const trackedAvatarId = trackedParameters.get('/avatar/change')?.value?.toString();

  useEffect(() => {
    function getTrackedParameters() {
      window.IPC.get('trackedParameters:getTrackedParameters').then(data => {
        setTrackedParameters(new Map(data));
      });
      window.IPC.get('trackedParameters:getBatchingActive').then(data => setBatchingActive(data));
    }

    getTrackedParameters();

    window.IPC.get('trackedParameters:getBufferFrequencyLimit').then(data => {
      setSufferFrequencyLimit(data);
    });

    const intervalId = setInterval(getTrackedParameters, 1500);

    const trackedParameterListener = window.IPC.receive('trackedParameters:trackedParameter', (data) => {
      setTrackedParameters(state => new Map(state.set(data[0], data[1])));
    });

    const trackedParametersListener = window.IPC.receive('trackedParameters:trackedParameters', (data) => {
      setTrackedParameters(new Map(data));
    });

    const settingsListener = window.IPC.receive('store:trackedParametersSettings', (data) => setParameterBlacklist(new Set(data.blacklist)));

    return () => {
      clearInterval(intervalId);
      if (trackedParameterListener) trackedParameterListener();
      if (trackedParametersListener) trackedParametersListener();
      if (settingsListener) settingsListener();
    };
  }, []);

  function frequencyColor(trackedParameter: TrackedParameter) {
    if (!bufferFrequencyLimit) return undefined;
    if (trackedParameter.frequency / bufferFrequencyLimit < 0.3) return theme.colors.success;
    if (trackedParameter.frequency / bufferFrequencyLimit < 0.7) return theme.colors.warning;
    return theme.colors.error;
  }

  function frequencyText(trackedParameter: TrackedParameter) {
    if (!bufferFrequencyLimit) return trackedParameter.frequency.toString();
    if (trackedParameter.frequency / bufferFrequencyLimit < 0.3) return 'Low';
    if (trackedParameter.frequency / bufferFrequencyLimit < 0.7) return 'Medium';
    return 'High';
  }

  function onCopy(value: string) {
    navigator.clipboard.writeText(value).then(() => {
      addNotification('Info', `Copied to clipboard`, { group: 'copyToClipboard' });
    });
  }

  function addToBlacklist(path: string) {
    window.IPC.send('store:addParameterToBlacklist', path);
  }

  function removeFromBlacklist(path: string) {
    window.IPC.send('store:removeParameterFromBlacklist', path);
  }

  return (<Segment width={'Full'} segmentTitle={'Parameters'} infoContent={segmentInfo}>

    <AvatarAndBatching>
      <AvatarName avatarId={trackedAvatarId} />
      {batchingActive && <div className={'batchingMessage'}>Batching <i className={'ri-spam-2-line'} /></div>}
    </AvatarAndBatching>

    <SegmentTable>
      <thead>
      <tr>
        <th>Path</th>
        <th>Value</th>
        <th style={{ width: '120px', textAlign: 'center' }}>Last message</th>
        <th style={{ width: '100px', textAlign: 'center' }}>Frequency</th>
        <th style={{ width: '100px', textAlign: 'center' }}>Buffering</th>
        <th style={{ width: '100px', textAlign: 'center' }}>Blacklist</th>
      </tr>
      </thead>
      <tbody style={{ wordBreak: 'break-all' }}>
      {trackedParameters.size === 0 && <tr>
        <td colSpan={5} style={{ textAlign: 'center' }}>Waiting for OSC activity...</td>
      </tr>}
      {[...trackedParameters.entries()].map(([path, trackedParameter]) => (
        <tr key={path}>
          {/* Path */}
          <td>
            <CopyValue onClick={() => onCopy(path)}>{path}</CopyValue>
          </td>
          {/* Value */}
          <td style={{ maxWidth: '110px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <CopyValue onClick={() => onCopy(trackedParameter.value.toString())}>{trackedParameter.value.toString()}</CopyValue>
          </td>
          {/* Last message */}
          <td style={{ textAlign: 'center' }}>
            {new Date(trackedParameter.lastActivity).toLocaleTimeString()}
          </td>
          {/* Frequency */}
          <td style={{ textAlign: 'center' }}>
            <span style={{ color: frequencyColor(trackedParameter) }}>{frequencyText(trackedParameter)}</span>
          </td>
          {/* Buffering */}
          <td style={{ textAlign: 'center' }}>
            <span style={{ color: trackedParameter.buffered ? theme.colors.error : theme.colors.success }}>
              {trackedParameter.buffered ? 'Yes' : 'No'}
            </span>
          </td>
          {/* Blacklist */}
          <BlacklistCellStyled>
            {parameterBlacklist.has(path) ?
              <i title={'Remove from blacklist'} className={'ri-close-circle-line'} style={{ color: theme.colors.error }} onClick={() => removeFromBlacklist(path)} />
              :
              <i title={'Add to blacklist'} className={'ri-add-circle-line'} onClick={() => addToBlacklist(path)} />
            }
          </BlacklistCellStyled>
        </tr>
      ))}
      </tbody>
    </SegmentTable>
  </Segment>);
}

const segmentInfo = <>
  <p>
    <b>Frequncy</b> means how often a parameter is detected, if one parameter is being sent out too often (many times each second) it will start buffering.
    <br />
    <b>Buffering</b> means that the parameter wont be forwarded to the website right away, but will instead be sent out every ~1 second.
  </p>
  <p>
    <b>Batching</b> notification will be displayed if too many different parameters are still being send out.
    Parameters will automatically be grouped together and sent to the server in batches.
    This means there will be an additional slight delay before parameter changes are reflected on the website (0.5 seconds currently)
  </p>
</>;

const AvatarAndBatching = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 15px;

  .batchingMessage {
    font-size: 18px;
    margin: 10px;
    color: ${theme.colors.warning};

    i {
      font-size: 22px;
    }
  }
`;

const CopyValue = styled.span`
  cursor: pointer;
  transition: 0.05s linear;

  :hover {
    color: ${props => props.theme.colors.ui.element5};
  }
`;

const BlacklistCellStyled = styled.td`
  text-align: center !important;

  i {
    padding: 2px 5px;
    cursor: pointer;
    font-size: 19px;
    transition: 0.1s linear;

    :hover {
      color: ${props => props.theme.colors.ui.element5} !important;
    }
  }

  &[aria-disabled='true'] {
    pointer-events: none;
    filter: saturate(0%);

    > i {
      color: ${props => props.theme.colors.font.textInactive};
    }
  }
`;
