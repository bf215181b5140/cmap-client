import { createContext, Dispatch, SetStateAction } from 'react';
import { AvatarButtonDTO, BackgroundDTO, InteractionKeyDTO, LayoutDTO, ThemeDTO, TierDTO } from 'cmap-shared';
import { LayoutsReducerAction } from './reducers/layouts.reducer';
import { AvatarButtonsReducerAction } from './reducers/avatarButtons.reducer';

export type LayoutSections = 'parameters' | 'presets' | 'customPresets' | 'avatars' | 'interactionKeys';

export interface LayoutsPageData {
  layoutSection: LayoutSections | undefined;
  setLayoutSection: Dispatch<SetStateAction<LayoutSections | undefined>>;
  tier: TierDTO;
  background: BackgroundDTO;
  theme: ThemeDTO;
  layouts: LayoutDTO[];
  layoutsDispatch: Dispatch<LayoutsReducerAction>;
  avatarButtons: AvatarButtonDTO[];
  avatarButtonsDispatch: Dispatch<AvatarButtonsReducerAction>;
  interactionKeys: InteractionKeyDTO[];
  setInteractionKeys: Dispatch<SetStateAction<InteractionKeyDTO[]>>;
}

export const LayoutsPageContext = createContext<LayoutsPageData>(undefined!);
