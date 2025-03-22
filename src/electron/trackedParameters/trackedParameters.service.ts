import { VrcParameter } from 'cmap-shared/src/objects/vrcParameter';
import { TrackedParameter } from './trackedParameters.model';
import { IPC } from '../ipc/typedIpc.service';
import { BRIDGE } from '../bridge/bridge.service';
import { SETTINGS } from '../store/settings/settings.store';
import { Message } from 'node-osc';
import { UsedAvatarButtonDTO, UsedParameterButtonDTO, UsedPresetButtonDTO } from 'cmap-shared';
import { TRACKED_PARAMETERS_STORE } from '../store/trackedParameters/trackedParameters.store';
import { app } from 'electron';

// const ignoredOscParameters = ['/avatar/parameters/VelocityZ', '/avatar/parameters/VelocityY', '/avatar/parameters/VelocityX',
//                               '/avatar/parameters/InStation', '/avatar/parameters/Seated', '/avatar/parameters/Upright',
//                               '/avatar/parameters/AngularY', '/avatar/parameters/Grounded', '/avatar/parameters/Face',
//                               '/avatar/parameters/GestureRightWeight', '/avatar/parameters/GestureRight',
//                               '/avatar/parameters/GestureLeftWeight', '/avatar/parameters/GestureLeft', '/avatar/parameters/Voice',
//                               '/avatar/parameters/Viseme', '/avatar/parameters/VelocityMagnitude'];

export class TrackedParametersService extends Map<string, TrackedParameter> {
  private clearOnAvatarChange = SETTINGS.get('trackedParameters').clearOnAvatarChange;
  private detectedAvatarId: string | undefined;
  private avatarChangePath = '/avatar/change';

  private saveParameters = SETTINGS.get('trackedParameters').saveParameters;
  private saveParametersIntervalId: NodeJS.Timeout | undefined;

  private blacklist = new Set<string>(SETTINGS.get('trackedParameters').blacklist);
  private ignoredParameters = new Set(['/avatar/parameters/VelocityZ', '/avatar/parameters/VelocityY', '/avatar/parameters/VelocityX',
                                       '/avatar/parameters/AngularY', '/avatar/parameters/Upright',
                                       '/avatar/parameters/GestureRightWeight', '/avatar/parameters/GestureLeftWeight',
                                       '/avatar/parameters/Voice', '/avatar/parameters/Viseme',
                                       '/avatar/parameters/VelocityMagnitude']);

  private resetFrequencyIntervalMs = 2000; // How often do we reset/reduce frequency values
  private bufferFrequencyLimit = Math.floor(this.resetFrequencyIntervalMs / 300); // anything more than once per 400ms gets buffered
  private bufferTimeMs = 1000;

  private batchTimeMs = 10000;
  private batchPointsLimit = 100;
  private batchPoints = 0;
  private batchingActive: boolean = false;
  private batchedTrackedParameters = new Map<string, TrackedParameter>();

  constructor() {
    super();

    SETTINGS.onChange('trackedParameters', settings => {
      this.clearOnAvatarChange = settings.clearOnAvatarChange;
      this.saveParameters = settings.saveParameters;
      this.blacklist = new Set(settings.blacklist);

      // call save parameter interval and if we're saving then save right away
      this.saveParametersInterval();
      if (this.saveParameters) this.saveParametersToStore();
    });

    if (this.saveParameters) {
      // get saved parameters from store
      const savedParameters = TRACKED_PARAMETERS_STORE.get('parameters');
      // first check if we have avatar parameter saved (so other parameters can get associated with the avatar)
      const savedAvatarId = savedParameters.find(tp => tp.path === this.avatarChangePath)?.value?.toString();
      if (savedAvatarId) this.detectedAvatarId = savedAvatarId;
      // set all parameters
      savedParameters.forEach(tp => this.setValue(tp));
      // start interval for saving
      this.saveParametersInterval();
    }
    app.on('quit', () => this.saveParametersToStore());

    BRIDGE.on('osc:vrcParameter', vrcParameter => this.onVrcParameter(vrcParameter));
    BRIDGE.on('socket:applyParameters', callback => callback(this.toVrcParameterList()));
    BRIDGE.on('socket:usedParameterButton', usedParameterButton => this.onUsedParameterButton(usedParameterButton));
    BRIDGE.on('socket:usedPresetButton', usedPresetButton => this.onUsedPresetButton(usedPresetButton));
    BRIDGE.on('socket:usedAvatarButton', usedAvatarButton => this.onUsedAvatarButton(usedAvatarButton));

    IPC.handle('trackedParameters:getIgnoredParameters', async () => Array.from(this.ignoredParameters.values()));
    IPC.handle('trackedParameters:getTrackedParameters', async () => Array.from(this.entries()));
    IPC.handle('trackedParameters:getBufferFrequencyLimit', async () => this.bufferFrequencyLimit);
    IPC.handle('trackedParameters:getBatchingActive', async () => this.batchPoints >= this.batchPointsLimit);

    // tracked parameter buffering reset interval
    setInterval(() => this.resetFrequencies(), this.resetFrequencyIntervalMs);

    // batching reset points interval
    // Every 1/5 of batch time we reduce points by 1/5
    setInterval(() => this.batchPoints = Math.max(0, this.batchPoints - (this.batchPointsLimit / 5)), this.batchTimeMs / 5);
  }

  /**
   * Main entry method to consume vrcParameters from OSC
   *
   */
  private onVrcParameter(vrcParameter: VrcParameter) {
    // filter ignored parameters
    if (this.ignoredParameters.has(vrcParameter.path)) return;

    // filter blacklisted parameters
    if (this.blacklist.has(vrcParameter.path)) return;

    const trackedParameter = this.setValue(vrcParameter);

    // track avatar id and run clear parameters if needed
    if (vrcParameter.path === this.avatarChangePath) {
      this.detectedAvatarId = trackedParameter.value.toString();
      if (this.clearOnAvatarChange) this.clearParametersAfterAvatarChange();
    }

    this.bufferTrackedParameter(vrcParameter.path, trackedParameter);
  }

  /**
   * Handle tracked parameter buffering and emit them when they're ready
   *
   */
  bufferTrackedParameter(path: string, trackedParameter: TrackedParameter) {
    // if it's already buffered return
    if (trackedParameter.buffered) return;

    // check parameter frequency and buffer if needed before sending it over socket
    if (trackedParameter.frequency > this.bufferFrequencyLimit) {
      trackedParameter.setBuffered(true);
      setTimeout(() => {
        // emit and forward to batching for socket, as it will be after timeout and un-buffer parameter
        this.batchTrackedParameter(path, trackedParameter);
        IPC.emit('trackedParameters:trackedParameter', [path, trackedParameter]);
        trackedParameter.setBuffered(false);
      }, this.bufferTimeMs);
    } else {
      // emit and forward to batching for socket, without buffering
      this.batchTrackedParameter(path, trackedParameter);
      IPC.emit('trackedParameters:trackedParameter', [path, trackedParameter]);
    }
  }

  /**
   * Handle tracked parameter batching for socket
   *
   * Here we only emit events for socket, internally for the app we should have already emitted trackedParameters
   *
   */
  batchTrackedParameter(path: string, trackedParameter: TrackedParameter) {
    // if we're already batching then add it to the map and return
    if (this.batchingActive) {
      this.batchedTrackedParameters.set(path, trackedParameter);
      // we still add points a bit over the limit, this will smooth out batching to be continuous if it's always active
      // otherwise it will batch once then spam until limit etc
      if (this.batchPoints < this.batchPointsLimit * 1.5) this.batchPoints++;
      return;
    }

    // add point
    this.batchPoints++;

    if (this.batchPoints >= this.batchPointsLimit) {
      // if we hit batch points limit, then start batching
      this.batchingActive = true;
      this.batchedTrackedParameters.set(path, trackedParameter);

      // send out batched items and clear the batch
      setTimeout(() => {
        BRIDGE.emit('socket:sendVrcParameters', [...this.batchedTrackedParameters.entries()].map(p => ({ path: p[0], value: p[1].value })));
        this.batchedTrackedParameters.clear();
        this.batchingActive = false;
      }, 500);
    } else {
      // if batching is not required just parameter right away to socket
      BRIDGE.emit('socket:sendVrcParameter', { path: path, value: trackedParameter.value });
    }
  }

  /**
   * usedParameterButton is received from server when someone presses a button
   *
   * Check if parameter can be used based on current exp
   *
   * Emit button parameter and any additional callback parameters after a delay to vrchat
   *
   */
  private onUsedParameterButton(usedParameterButton: UsedParameterButtonDTO) {
    const canSend = !usedParameterButton.exp || this.consumeExpCost(usedParameterButton.exp.path, usedParameterButton.exp.value);
    if (!canSend) return;

    BRIDGE.emit('osc:sendMessage', new Message(usedParameterButton.path, usedParameterButton.value));

    usedParameterButton.callbackParameters.forEach(cp => {
      setTimeout(() => BRIDGE.emit('osc:sendMessage', new Message(cp.path, cp.value)), 1000 * cp.seconds);
    });
  }

  /**
   * usedPresetButton is received from server when someone presses a preset button
   *
   * Check if preset can be used based on current exp
   *
   * Emit parameters and any additional callback parameters after a delay to vrchat
   *
   */
  private onUsedPresetButton(usedPresetButton: UsedPresetButtonDTO) {
    const canSend = !usedPresetButton.exp || this.consumeExpCost(usedPresetButton.exp.path, usedPresetButton.exp.value);
    if (!canSend) return;

    usedPresetButton.parameters.forEach(p => {
      BRIDGE.emit('osc:sendMessage', new Message(p.path, p.value));
    });

    usedPresetButton.callbackParameters.forEach(cp => {
      setTimeout(() => BRIDGE.emit('osc:sendMessage', new Message(cp.path, cp.value)), 1000 * cp.seconds);
    });
  }

  /**
   * usedAvatarButton is received from server when someone presses an avatar button
   *
   * Emit avatar change parameter to vrchat
   *
   */
  private onUsedAvatarButton(usedAvatarButton: UsedAvatarButtonDTO) {
    BRIDGE.emit('osc:sendMessage', new Message(this.avatarChangePath, usedAvatarButton.vrcAvatarId));
  }

  /**
   * If parameter for exp is avaiable and is a number then reduce it and if it's still a viable value (>=0) emit new exp parameter to vrchat
   *
   */
  private consumeExpCost(path: string, exp: number): boolean {
    const value = this.get(path)?.value;

    if (typeof value !== 'number') return true;

    let newValue = value - exp;
    if (newValue < 0) return false;

    BRIDGE.emit('osc:sendMessage', new Message(path, newValue));
    return true;
  }

  /**
   * Logic for clearing parameters when detecting avatar change parameter
   *
   */
  private clearParametersAfterAvatarChange() {
    // wait time in ms before and after avatar change parameter where we collect avatar parameters
    const waitTime = 300;

    setTimeout(() => {
      // set cutoutTime to 2 * wait time
      const cutoutTime = Date.now() - (waitTime * 2);

      this.forEach((tp, path) => {
        if (tp.lastActivity < cutoutTime && tp.avatarId !== this.detectedAvatarId) {
          // filter tracked parameters that are older than cutoutTime and their associated avatarId isn't currently detected avatar
          // associated avatarId check prevents deleting parameters with currently default values (they won't be sent with avatar change) after switching worlds
          this.delete(path);
        } else {
          // because parameters for new avatar come right before we have new avatar id (inside cutoutTime), we have to associate them with its correct new avatar id
          tp.avatarId = this.detectedAvatarId;
        }
      });

      // emit new tracked parameters
      const vrcParameters = this.toVrcParameterList();
      BRIDGE.emit('socket:sendAllVrcParameters', vrcParameters);
      IPC.emit('trackedParameters:trackedParameters', Array.from(this.entries()));

    }, waitTime);
  }

  /**
   * Reset or reduce the frequency number for each tracked parameter
   *
   */
  private async resetFrequencies() {
    // How many frequency points we reduce, calculated to 1 per full second for each second of reset interval (or at least one point)
    const intervalPoints = Math.max(1, Math.floor(this.resetFrequencyIntervalMs / 1000));
    this.forEach(tp => {
      if (tp.buffered) return; // skip if parameter is buffered
      tp.frequency = Math.max(0, tp.frequency - intervalPoints);
    });
  }

  /**
   * Sets the value for vrcParameter in the map while also retreiving TrackedParameter object
   *
   */
  public setValue(vrcParameter: VrcParameter) {
    let param = this.get(vrcParameter.path);
    if (!param) {
      param = new TrackedParameter(vrcParameter.value, this.detectedAvatarId);
      super.set(vrcParameter.path, param);
    } else {
      param.setValue(vrcParameter.value, this.detectedAvatarId);
    }
    return param;
  }

  public toVrcParameterList(): VrcParameter[] {
    return [...this.entries()].map(p => ({ path: p[0], value: p[1].value }));
  }

  /**
   * Manage interval for periodically saving parameters to electron store. (In case app closes in a way that saving on close event wouldn't work)
   *
   * Saving every 60 seconds
   *
   */
  private saveParametersInterval() {
    if (this.saveParameters) {
      if (this.saveParametersIntervalId) return;
      this.saveParametersIntervalId = setInterval(() => this.saveParametersToStore(), 60 * 1000);
    } else {
      clearInterval(this.saveParametersIntervalId);
      this.saveParametersIntervalId = undefined;
    }
  }

  /**
   * Saves parameters to store
   *
   */
  private saveParametersToStore() {
    TRACKED_PARAMETERS_STORE.set('parameters', this.toVrcParameterList());
  }
}
