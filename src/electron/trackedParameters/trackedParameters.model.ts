import { VrcParameter } from 'cmap-shared/src/objects/vrcParameter';

export interface TrackedParameterDTO {
  path: string;
  value: VrcParameter['value'];
  frequency: number;
  lastActivity: number;
  buffered: boolean;
}

export class TrackedParameter {
  value: VrcParameter['value'];
  avatarId: string | undefined;
  frequency: number;
  lastActivity: number;
  buffered: boolean = false;

  constructor(value: VrcParameter['value'], avatarId?: string) {
    this.value = value;
    this.avatarId = avatarId;
    this.frequency = 1;
    this.lastActivity = Date.now();
  }

  public setValue(value: VrcParameter['value'], avatarId?: string) {
    this.value = value;
    this.avatarId = avatarId;
    if (!this.buffered) this.frequency++;
    this.lastActivity = Date.now();
  }

  public setBuffered(buffered: boolean) {
    this.buffered = buffered;
    if (!buffered) this.frequency = Math.max(0, this.frequency - 1);
  }
}
