import { VrcParameter } from 'cmap2-shared/src/objects/vrcParameter';
import { TrackedParameter } from './trackedParameters.model';
import { z } from 'zod';
import { parameterValueObjectOrAvatarSchema } from 'cmap2-shared/src/shared';
import { IPC } from '../ipc/typedIpc.service';
import { BRIDGE } from '../bridge/bridge.service';
import { SETTINGS } from '../store/settings/settings.store';
import { Message } from 'node-osc';

export class TrackedParametersService extends Map<VrcParameter['path'], TrackedParameter> {
  private clearOnAvatarChange: boolean = SETTINGS.get('trackedParameters').clearOnAvatarChange;
  private socketParameterBlacklist = new Set<string>(SETTINGS.get('socketParameterBlacklist'));

  private resetFrequencyIntervalMs = 2000;

  private bufferFrequencyLimit = Math.floor(this.resetFrequencyIntervalMs / 200); // anything more than once per 200ms gets buffered
  private bufferTimeMs = 500;

  constructor() {
    super();

    SETTINGS.onChange('trackedParameters', settings => this.clearOnAvatarChange = settings.clearOnAvatarChange);
    SETTINGS.onChange('socketParameterBlacklist', data => this.socketParameterBlacklist = new Set(data));

    BRIDGE.on('osc:message', vrcParameter => this.onNewParameter(vrcParameter));
    BRIDGE.on('socket:applyParameters', callback => callback(this.toDto()));
    BRIDGE.on('socket:useCostParameter', vrcParameter => {
      const value = this.get(vrcParameter.path)?.value;
      let newValue: number | undefined = undefined;
      if (typeof value === 'number' && typeof vrcParameter.value === 'number') newValue = value - vrcParameter.value;
      if (newValue) BRIDGE.emit('osc:sendMessage', new Message(vrcParameter.path, newValue));
    });

    setInterval(() => this.resetFrequencies(), this.resetFrequencyIntervalMs);
  }

  private onNewParameter(vrcParameter: VrcParameter) {
    const trackedParameter = this.setValue(vrcParameter.path, vrcParameter.value);
    if (this.clearOnAvatarChange && vrcParameter.path.startsWith('/avatar/change')) this.clearParametersAfterAvatarChange();

    // emit new parameter for application
    BRIDGE.emit('trackedParameters:parameter', vrcParameter);
    IPC.emit('trackedParameters:parameter', vrcParameter);

    this.sendParameterToSocket(vrcParameter, trackedParameter);
  }

  private sendParameterToSocket(vrcParameter: VrcParameter, trackedParameter: TrackedParameter) {
    // if it's blacklisted return
    if (this.socketParameterBlacklist.has(vrcParameter.path)) return;

    // if it's already buffered return
    if (trackedParameter.buffered) return;

    // check parameter frequency and buffer if needed before sending it over socket
    if (trackedParameter.frequency > this.bufferFrequencyLimit) {
      trackedParameter.buffered = true;
      setTimeout(() => {
        // send out value as it will be then
        BRIDGE.emit('socket:sendParameter', { path: vrcParameter.path, value: trackedParameter.value });
        trackedParameter.buffered = false;
      }, this.bufferTimeMs);
    } else {
      BRIDGE.emit('socket:sendParameter', vrcParameter);
    }
  }

  private clearParametersAfterAvatarChange() {
    // wait time in ms before and after avatar change parameter where we collect avatar parameters
    const waitTime = 300;

    setTimeout(() => {
      // set cutoutTime to 2 * wait time
      const cutoutTime = Date.now() - (waitTime * 2);

      // filter tracked parameters that are older than cutoutTime
      this.forEach((tp, path) => {
        if (tp.lastActivity < cutoutTime) this.delete(path);
      });

      // emit new tracked parameters
      const trackedparametersDto = this.toDto();
      BRIDGE.emit('trackedParameters:parameters', trackedparametersDto);
      BRIDGE.emit('socket:sendParameters', trackedparametersDto);
      IPC.emit('trackedParameters:parameters', trackedparametersDto.filter(p => !this.socketParameterBlacklist.has(p.path)));

    }, waitTime);
  }

  private async resetFrequencies() {
    const intervalPoints = Math.floor(this.resetFrequencyIntervalMs / 1000);
    this.forEach(tp => tp.frequency = tp.frequency - intervalPoints);
  }

  public setValue(path: string, value: z.infer<typeof parameterValueObjectOrAvatarSchema>) {
    let param = this.get(path);
    if (!param) {
      param = new TrackedParameter(value);
    } else {
      param.value = value;
    }
    super.set(path, param);
    return param;
  }

  public toDto(): VrcParameter[] {
    return [...this.entries()].map(p => ({ path: p[0], value: p[1].value }));
  }
}
