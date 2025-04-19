import { GroupDTO, LayoutDTO, ParameterBadgeDTO, ParameterButtonDTO, PresetButtonDTO, UploadedFileDTO } from 'cmap-shared';

export type LayoutsReducerAction = { type: 'setLayouts', layouts: LayoutDTO[] } |
  { type: 'addLayout', layout: LayoutDTO } |
  { type: 'editLayout', layout: LayoutDTO } |
  { type: 'removeLayout', layout: LayoutDTO } |
  // { type: 'saveControlParameters', controlParameters: ControlParameterDTO[], layoutId: string } |
  // { type: 'removeControlParameter', controlParameter: ControlParameterDTO, layoutId: string } |
  { type: 'saveParameterBadges', layoutId: string, parameterBadges: ParameterBadgeDTO[] } |
  { type: 'removeParameterBadge', layoutId: string, parameterBadge: ParameterBadgeDTO } |
  { type: 'addGroup', layoutId: string, group: GroupDTO } |
  { type: 'editGroup', layoutId: string, group: GroupDTO } |
  { type: 'removeGroup', layoutId: string, groupId: string } |
  { type: 'setGroupOrder', layoutId: string, groups: GroupDTO[] } |
  { type: 'addParameterButton', layoutId: string, groupId: string, parameterButton: ParameterButtonDTO } |
  { type: 'editParameterButton', layoutId: string, groupId: string, parameterButton: ParameterButtonDTO } |
  { type: 'removeParameterButton', layoutId: string, groupId: string, parameterButtonId: string } |
  { type: 'setParameterButtonOrder', layoutId: string, groupId: string, parameterButtons: ParameterButtonDTO[] } |
  { type: 'addPresetButton', layoutId: string, presetButton: PresetButtonDTO } |
  { type: 'editPresetButton', layoutId: string, presetButton: PresetButtonDTO } |
  { type: 'removePresetButton', layoutId: string, presetButtonId: string } |
  { type: 'setPresetButtonOrder', layoutId: string, presetButtons: PresetButtonDTO[] } |
  { type: 'saveCustomPresets', layout: LayoutDTO } |
  { type: 'changeParameterButtonPicture', layoutId: string, groupId: string, parameterButtonId: string, image: UploadedFileDTO | null } |
  { type: 'changePresetButtonPicture', layoutId: string, presetButtonId: string, image: UploadedFileDTO | null };

export default function layoutsReducer(state: LayoutDTO[], action: LayoutsReducerAction) {
  switch (action.type) {
    case 'setLayouts':
      return action.layouts;
    case 'addLayout':
      return [...state, action.layout];
    case 'editLayout':
      return state.map(layout => {
        if (layout.id === action.layout.id) return { ...layout, ...action.layout };
        return layout;
      });
    case 'removeLayout':
      return state.filter(layout => layout.id !== action.layout.id);
    case 'saveParameterBadges':
      return state.map(layout => {
        if (layout.id === action.layoutId) layout.parameterBadges = action.parameterBadges;
        return layout;
      });
    case 'removeParameterBadge':
      return state.map(layout => {
        if (layout.id === action.layoutId) layout.parameterBadges = layout.parameterBadges?.filter(b => b.id !== action.parameterBadge.id);
        return layout;
      });
    case 'addPresetButton':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          if (!layout.presetButtons) layout.presetButtons = [];
          layout.presetButtons.push(action.presetButton);
        }
        return layout;
      });
    case 'editPresetButton':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          layout.presetButtons = layout.presetButtons?.map(preset => {
            if (preset.id === action.presetButton.id) return { ...preset, ...action.presetButton };
            return preset;
          });
        }
        return layout;
      });
    case 'removePresetButton':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          // get order number for deleted preset
          const missingOrder = layout.presetButtons?.find(g => g.id === action.presetButtonId)?.order;
          layout.presetButtons = layout.presetButtons?.filter(preset => preset.id !== action.presetButtonId);
          // set order - 1 for presets that are bigger other than the deleted
          if (missingOrder) {
            layout.presetButtons?.forEach(p => {
              if (p.order > missingOrder) p.order--;
            });
          }
        }
        return layout;
      });
    case 'setPresetButtonOrder':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          layout.presetButtons = action.presetButtons;
        }
        return layout;
      });
    case 'addGroup':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          if (!layout.groups) layout.groups = [];
          layout.groups.push(action.group);
        }
        return layout;
      });
    case 'editGroup':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          layout.groups = layout.groups?.map(group => {
            if (group.id === action.group.id) return { ...group, ...action.group };
            return group;
          });
        }
        return layout;
      });
    case 'removeGroup':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          // get order number for deleted group
          const missingOrder = layout.groups?.find(g => g.id === action.groupId)?.order;
          layout.groups = layout.groups?.filter(group => group.id !== action.groupId);
          // set order - 1 for groups that are bigger other than the deleted
          if (missingOrder) {
            layout.groups?.forEach(g => {
              if (g.order > missingOrder) g.order--;
            });
          }
        }
        return layout;
      });
    case 'setGroupOrder':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          layout.groups = action.groups;
        }
        return layout;
      });
    case 'addParameterButton':
      return state.map(layout => {
        if (layout.id === action.layoutId && layout.groups) {
          const tempGroup = layout.groups.find(group => group.id === action.groupId);
          if (tempGroup) {
            if (!tempGroup.parameterButtons) tempGroup.parameterButtons = [];
            tempGroup.parameterButtons.push(action.parameterButton);
          }
        }
        return layout;
      });
    case 'editParameterButton':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          layout.groups = layout.groups?.map(group => {
            if (group.id === action.groupId) {
              group.parameterButtons = group.parameterButtons?.map(button => {
                if (button.id === action.parameterButton.id) return { ...button, ...action.parameterButton, id: action.parameterButton.id! };
                return button;
              });
            }
            return group;
          });
        }
        return layout;
      });
    case 'removeParameterButton':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          layout.groups = layout.groups?.map(group => {
            if (group.id === action.groupId) {
              // get order number for deleted button
              const missingOrder = group.parameterButtons?.find(b => b.id === action.parameterButtonId)?.order;
              group.parameterButtons = group.parameterButtons?.filter(button => button.id !== action.parameterButtonId);
              // set order - 1 for buttons that are bigger other than the deleted
              if (missingOrder) {
                group.parameterButtons?.forEach(b => {
                  if (b.order > missingOrder) b.order--;
                });
              }
            }
            return group;
          });
        }
        return layout;
      });
    case 'setParameterButtonOrder':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          layout.groups = layout.groups?.map(group => {
            if (group.id === action.groupId) {
              group.parameterButtons = action.parameterButtons;
            }
            return group;
          });
        }
        return layout;
      });
    case 'saveCustomPresets':
      return state.map(layout => {
        if (layout.id === action.layout.id) {
          return {
            ...layout,
            customPresetsEnabled: action.layout.customPresetsEnabled,
            customPresetsWhitelist: action.layout.customPresetsWhitelist,
            customPresetsBlacklist: action.layout.customPresetsBlacklist,
          };
        }
        return layout;
      });
    case 'changeParameterButtonPicture':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          layout.groups = layout.groups?.map(group => {
            if (group.id === action.groupId) {
              group.parameterButtons = group.parameterButtons?.map(button => {
                if (button.id === action.parameterButtonId) return { ...button, image: action.image };
                return button;
              });
            }
            return group;
          });
        }
        return layout;
      });
    case 'changePresetButtonPicture':
      return state.map(layout => {
        if (layout.id === action.layoutId) {
          layout.presetButtons = layout.presetButtons?.map(preset => {
            if (preset.id === action.presetButtonId) return { ...preset, image: action.image };
            return preset;
          });
        }
        return layout;
      });
    default:
      return state;
  }
}
