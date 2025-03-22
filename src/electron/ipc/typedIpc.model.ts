import { VrcOscAvatar } from '../../shared/objects/vrcOscAvatar';
import { DetectedGamesDTO, VrcParameter } from 'cmap-shared';
import { WindowState } from '../../shared/enums/windowState';
import { UpdaterData } from '../updater/updater.model';
import { WindowSize } from '../../shared/enums/windowSize';
import { TrackedParameter } from '../trackedParameters/trackedParameters.model';
import { TrackedParametersSettings } from '../../shared/objects/settings';

export type IpcGetOptions = {
  'socket:connection': boolean;
  'osc:activity': number | undefined;
  'trackedParameters:getIgnoredParameters': string[];
  'trackedParameters:getTrackedParameters': [string, TrackedParameter][];
  'trackedParameters:getBufferFrequencyLimit': number;
  'trackedParameters:getBatchingActive': boolean;
  'utility:fingerprint': string;
  // these stores should get reworked wihtout IPC calls
  getAvatars: VrcOscAvatar[];
};

export type IpcSendOptions = {
  'window:state': WindowState;
  'window:size': WindowSize;
  'osc:sendParameter': VrcParameter;
  'trackedParameters:set': VrcParameter;
  'trackedParameters:delete': string;
  'socket:connect': undefined;
  'socket:disconnect': undefined;
  'gameDetector:check': void;
  'updater:check': undefined;
  'updater:downloadAndInstall': string;
  'store:addParameterToBlacklist': string;
  'store:removeParameterFromBlacklist': string;
  // these stores should get reworked wihtout IPC calls
  saveAvatars: VrcOscAvatar[];
};

export type IpcReceiveOptions = {
  'window:size': WindowSize;
  'osc:vrcParameter': VrcParameter;
  'trackedParameters:trackedParameter': [string, TrackedParameter];
  'trackedParameters:trackedParameters': [string, TrackedParameter][];
  'socket:connection': boolean;
  'gameDetector:detectedGames': DetectedGamesDTO;
  'updater:update': UpdaterData;
  'updater:progress': number | false;
  'store:trackedParametersSettings': TrackedParametersSettings;
};
