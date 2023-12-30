import { WindowState } from './enums';
import { SocketConnection } from './SocketConnection';
import { ApplicationSettings, ClientCredentials } from './classes';
import { VrcParameter } from 'cmap2-shared';
import { ToyCommand } from 'lovense';
import { LovenseStatus, ToyCommandParameter } from './lovense';

export interface IElectronAPI {
    getClientCredentials: () => Promise<ClientCredentials>,
    setClientCredentials: (clientCredentials: ClientCredentials) => void,
    setWindowState: (windowState: WindowState) => void,
    updateConnectionStatus: (callback: (event: any, connectionStatus: SocketConnection) => void) => void
    getConnectionStatus: () => Promise<SocketConnection>,
    disconnectSocket: () => void,
    getApplicationSettings: () => Promise<ApplicationSettings | null>,
    setApplicationSettings: (applicationSettings: ApplicationSettings) => void,
    forwardOscToRenderer: (forward: boolean) => void,
    vrcParameter: (callback: (event: Electron.IpcRendererEvent, message: VrcParameter) => void) => void,
    // Lovense
    getLovenseStatus: () => void,
    lovenseStatus: (callback: (event: Electron.IpcRendererEvent, lovenseStatus: LovenseStatus) => void) => void,
    lovenseConnect: () => void,
    lovenseDisconnect: () => void,
    sendLovenseToyCommand: (toyCommand: ToyCommand) => void,
    setToyCommandParameters: (toyCommandParameters: ToyCommandParameter[]) => void,
    getToyCommandParameters: () => Promise<ToyCommandParameter[]>,
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}
