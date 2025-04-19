import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter/rxjs';
import type { WindowSize } from '../../shared/enums/windowSize';
import { DetectedGamesDTO, UsedAvatarButtonDTO, UsedParameterButtonDTO, UsedPresetButtonDTO, VrcParameter } from 'cmap-shared';
import { Message } from 'node-osc';
import type { WindowState } from '../../shared/enums/windowState';
import { UsedCustomPresetDTO } from 'cmap-shared/dist/objects/usedCustomPreset';

type MessageEvents = {
  'window:state': (windowState: WindowState) => void;
  'window:size': (windowSize: WindowSize) => void;
  'osc:sendMessage': (oscMessage: Message) => void;
  'osc:vrcParameter': (vrcParameter: VrcParameter) => void;
  'socket:sendVrcParameter': (vrcParameter: VrcParameter) => void;
  'socket:sendVrcParameters': (vrcParameters: VrcParameter[]) => void;
  'socket:sendAllVrcParameters': (vrcParameters: VrcParameter[]) => void;
  'socket:applyParameters': (callback: (parameters: VrcParameter[]) => void) => void;
  'socket:usedParameterButton': (usedParameterButton: UsedParameterButtonDTO) => void;
  'socket:usedPresetButton': (usedPresetButton: UsedPresetButtonDTO) => void;
  'socket:usedCustomPreset': (usedCustomPreset: UsedCustomPresetDTO) => void;
  'socket:usedAvatarButton': (usedAvatarButton: UsedAvatarButtonDTO) => void;
  'gameDetector:detectedGames': (isGameDetected: DetectedGamesDTO) => void;
}

export const BRIDGE = new EventEmitter() as TypedEmitter<MessageEvents>;
