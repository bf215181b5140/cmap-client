import React, { useContext, useMemo, useState } from 'react';
import { getForcedItemLabel, LayoutDTO } from 'cmap-shared';
import { ModalContext } from '../../../../../../components/context/modal.context';
import Icon from '../../../../../../components/icon/icon.component';
import FormTable from '../../../../../../components/form/formTable.component';
import TextButton from '../../../../../../components/buttons/textButton.component';
import { SelectInputStyled } from '../../../../../../components/input/input.style';

interface CustomPresetAddParamsModalProps {
  layout: LayoutDTO;
  onSuccess: (parameters: string[]) => void;
}

export default function CustomPresetAddParamsModal({ layout, onSuccess }: CustomPresetAddParamsModalProps) {

  const { clearModal } = useContext(ModalContext);
  const sources = ['Layout', 'Group', 'Parameter button', 'Preset button'] as const;
  type SourceType = typeof sources[number];
  const [source, setSource] = useState<SourceType>(sources[0]);

  const [groupId, setGroupId] = useState<string | undefined>(layout?.groups?.[0]?.id);
  const [parameterButtonId, setParameterButtonId] = useState<string | undefined>(layout?.groups?.[0]?.parameterButtons?.[0]?.id);
  const [presetButtonId, setPresetButtonId] = useState<string | undefined>(layout?.presetButtons?.[0]?.id);

  const validSelection = useMemo(() => {
    switch (source) {
      case 'Layout':
        return true;
      case 'Group':
        return !!groupId;
      case 'Parameter button':
        return !!groupId && !!parameterButtonId;
      case 'Preset button':
        return !!presetButtonId;
      default:
        return false;
    }
  }, [source, groupId, parameterButtonId, presetButtonId]);

  function onChangeSource(value: SourceType) {
    setSource(value);
  }

  function onSave() {
    const parameters: string[] = [];

    switch (source) {
      case 'Layout':
        layout.groups?.forEach(group => group.parameterButtons?.forEach(parameterButton => {
          if (!parameters.includes(parameterButton.path)) parameters.push(parameterButton.path);
        }));
        break;
      case 'Group':
        layout.groups?.find(group => group.id === groupId)?.parameterButtons?.forEach(parameterButton => {
          if (!parameters.includes(parameterButton.path)) parameters.push(parameterButton.path);
        });
        break;
      case 'Parameter button':
        const parameterButton = layout.groups?.find(group => group.id === groupId)?.parameterButtons?.find(parameterButton => parameterButton.id === parameterButtonId);
        if (parameterButton && !parameters.includes(parameterButton.path)) parameters.push(parameterButton.path);
        break;
      case 'Preset button':
        layout.presetButtons?.forEach(presetButton => presetButton.parameters.forEach(parameterButtonParameter => {
          if (!parameters.includes(parameterButtonParameter.path)) parameters.push(parameterButtonParameter.path);
        }));
        break;
      default:
        return;
    }

    onSuccess(parameters);
    clearModal();
  }

  function onClose() {
    clearModal();
  }

  return (<>
      <div id="modalHeader">
        <h2>Add parameters</h2>
        <span onClick={onClose}><Icon className={'ri-close-line'} /></span>
      </div>

      <p>Select from where you want to take parameters and add them to the list</p>

      <FormTable visible={true}>
        <tr>
          <th style={{ width: '150px' }}>Take parameters from</th>
          <td>
            <SelectInputStyled value={source} onChange={(event) => onChangeSource(event.target.value as SourceType)} errors={!source}>
              {sources.map((s) => (<option key={s} value={s}>{s}</option>))}
            </SelectInputStyled>
          </td>
        </tr>
        {source !== 'Layout' && <tr>
          <td colSpan={2}>
            <hr />
          </td>
        </tr>}
        {(source === 'Group' || source === 'Parameter button') && <tr>
          <th>Group</th>
          <td>
            <SelectInputStyled value={groupId} onChange={(event) => setGroupId(event.target.value)} errors={!groupId}>
              {layout.groups?.map((g) => (<option key={g.id} value={g.id}>{getForcedItemLabel(g, 'group')}</option>))}
            </SelectInputStyled>
          </td>
        </tr>}
        {source === 'Parameter button' && <tr>
          <th>Button</th>
          <td>
            <SelectInputStyled value={parameterButtonId} onChange={(event) => setParameterButtonId(event.target.value)} errors={!parameterButtonId}>
              {layout.groups?.find(g => groupId && g.id === groupId)?.parameterButtons?.map((pb) => (<option key={pb.id} value={pb.id}>{getForcedItemLabel(pb, 'parameter')}</option>))}
            </SelectInputStyled>
          </td>
        </tr>}
        {source === 'Preset button' && <tr>
          <th>Preset</th>
          <td>
            <SelectInputStyled value={presetButtonId} onChange={(event) => setPresetButtonId(event.target.value)} errors={!presetButtonId}>
              {layout.presetButtons?.map((pb) => (<option key={pb.id} value={pb.id}>{getForcedItemLabel(pb, 'preset')}</option>))}
            </SelectInputStyled>
          </td>
        </tr>}
      </FormTable>

      <div id="modalFooter">
        <TextButton text={'Add paramters'} type={'submit'} onClick={() => onSave()} disabled={!validSelection} />
      </div>
    </>
  );
}