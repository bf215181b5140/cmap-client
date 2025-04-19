import Segment from '../../../../../components/segment/segment.component';
import { LayoutDTO, LayoutSchema } from 'cmap-shared';
import React, { useContext, useEffect } from 'react';
import { LayoutsPageContext } from '../../layouts.context';
import useCmapFetch from '../../../../../hooks/cmapFetch.hook';
import { useNotifications } from '../../../../../hooks/useNotifications.hook';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import HiddenInput from '../../../../../components/input/hidden.component';
import FormTable, { FormTableStyled } from '../../../../../components/form/formTable.component';
import FormRemoveRow from '../../../../../components/form/removeRow/formRemoveRow.component';
import FormAddRow from '../../../../../components/form/addRow/formAddRow.component';
import CheckboxInput from '../../../../../components/input/checkbox.component';
import FormControlRow from '../../../../../components/form/formControlRow.component';
import IconButton from '../../../../../components/buttons/iconButton.component';
import { CustomPresetsFormDTO, CustomPresetsFormSchema } from 'cmap-shared/dist/api/layouts/customPresets/customPresets';
import PickerOverlayTier from '../../../../../components/pickerOverlay/PickerOverlayTier.component';
import { ModalContext } from '../../../../../components/context/modal.context';
import CustomPresetAddParamsModal from './addParamsModal/customPresetAddParamsModal.component';
import styled from 'styled-components';
import ParameterInput from '../../../../../components/input/parameterInput/parameterInput.component';

interface CustomPresetsProps {
  layout: LayoutDTO;
}

export default function CustomPresets({ layout }: CustomPresetsProps) {

  const { setModal } = useContext(ModalContext);
  const { POST } = useCmapFetch();
  const { addNotification } = useNotifications();
  const { tier, layoutsDispatch } = useContext(LayoutsPageContext);
  const { register, setValue, control, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<CustomPresetsFormDTO>({
    resolver: zodResolver(CustomPresetsFormSchema),
    defaultValues: layout,
  });
  // @ts-ignore
  const whitelist = useFieldArray({ control, name: 'customPresetsWhitelist' });
  const whitelistLimit = 50;
  // @ts-ignore
  const blacklist = useFieldArray({ control, name: 'customPresetsBlacklist' });
  const blacklistLimit = 50;

  const canUse = tier.customPresets;

  useEffect(() => {
    reset(layout);
  }, [layout]);

  function onAddParameters(type: 'whitelist' | 'blacklist') {
    const addParameters = (parameters: string[]) => {
      let addedAll = true;
      let added = 0;
      switch (type) {
        case 'whitelist':
          parameters.forEach(parameter => {
            const customPresetsWhitelist = watch('customPresetsWhitelist');
            if (!customPresetsWhitelist.includes(parameter)) {
              if (customPresetsWhitelist.length < whitelistLimit) {
                whitelist.append(parameter);
                added++;
              } else {
                addedAll = false;
              }
            }
          });
          break;
        case 'blacklist':
          parameters.forEach(parameter => {
            const customPresetsBlacklist = watch('customPresetsBlacklist');
            if (!customPresetsBlacklist.includes(parameter)) {
              if (customPresetsBlacklist.length < blacklistLimit) {
                blacklist.append(parameter);
                added++;
              } else {
                addedAll = false;
              }
            }
          });
          break;
      }
      if (!addedAll) {
        addNotification('Warning', `Couldn't add all parameters, limit already reached!`);
      } else if (added === 0) {
        addNotification('Warning', 'No new parameters were added');
      } else if (added > 0) {
        addNotification('Success', `Added ${added} parameters.`);
      }
    };
    setModal(<CustomPresetAddParamsModal layout={layout} onSuccess={addParameters} />);
  }

  function onSubmit(formData: CustomPresetsFormDTO) {
    POST('layouts/customPreset', formData, LayoutSchema, data => {
      layoutsDispatch({ type: 'saveCustomPresets', layout: data });
      addNotification('Success', 'Custom preset settings saved.');
      reset(data);
    });
  }

  return (<Segment segmentTitle={'Custom presets'}>
    <p>Custom presets allow users to save a custom state of parameters.<br />
      But this can potentially include parameters that you don't set for any buttons/interactions so if there is anything you don't want to be controlled
      make sure to set up whitelist/blacklist accordingly.</p>
    <form onSubmit={handleSubmit(onSubmit)} style={{ position: 'relative' }}>
      <PickerOverlayTier tier={tier} valid={tier.customPresets} position={'right'} />
      <HiddenInput register={register} name={'id'} />
      <FormTable visible={true}>
        <tr>
          <th style={{ width: '150px' }}>Allow custom presets</th>
          <td><CheckboxInput register={register} name={'customPresetsEnabled'} errors={errors} readOnly={!canUse} /></td>
        </tr>
        <tr>
          <td colSpan={2}>
            <fieldset disabled={!canUse}>
              <legend>Whitelist</legend>
              <ListExplanationWrapper>
                <p>Users will only be able to save and trigger parameters from this list.<br /> Leave empty list to allow use of any parameter.</p>
                <IconButton role={'normal'} icon={'ri-play-list-add-line'} tooltip={'Add...'} size={'small'} disabled={!canUse} onClick={() => onAddParameters('whitelist')} />
              </ListExplanationWrapper>
              <FormTableStyled>
                {whitelist.fields.length > 0 && <thead>
                <tr>
                  <th>Parameter</th>
                  <th></th>
                </tr>
                </thead>}
                <tbody>
                {whitelist.fields.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <ParameterInput register={register} name={`customPresetsWhitelist.${index}`} defaultType={'input'} setValue={setValue} errors={errors} />
                    </td>
                    <FormRemoveRow onClick={() => whitelist.remove(index)} disabled={!canUse} />
                  </tr>
                ))}
                <tr>
                  <FormAddRow colSpan={1} items={whitelist.fields.length} limit={canUse ? whitelistLimit : 0} onClick={() => whitelist.append('')} />
                </tr>
                </tbody>
              </FormTableStyled>
            </fieldset>
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <fieldset disabled={!canUse}>
              <legend>Blacklist</legend>
              <ListExplanationWrapper>
                <p>Users will not be able to save and trigger parameters from this list.</p>
                <IconButton role={'normal'} icon={'ri-play-list-add-line'} tooltip={'Add...'} size={'small'} disabled={!canUse} onClick={() => onAddParameters('blacklist')} />
              </ListExplanationWrapper>
              <FormTableStyled>
                {blacklist.fields.length > 0 && <thead>
                <tr>
                  <th>Parameter</th>
                  <th></th>
                </tr>
                </thead>}
                <tbody>
                {blacklist.fields.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <ParameterInput register={register} name={`customPresetsBlacklist.${index}`} defaultType={'input'} setValue={setValue} errors={errors} />
                    </td>
                    <FormRemoveRow onClick={() => blacklist.remove(index)} disabled={!canUse} />
                  </tr>
                ))}
                <tr>
                  <FormAddRow colSpan={1} items={blacklist.fields.length} limit={canUse ? blacklistLimit : 0} onClick={() => blacklist.append('')} />
                </tr>
                </tbody>
              </FormTableStyled>
            </fieldset>
          </td>
        </tr>
        <FormControlRow colSpan={2}>
          <IconButton role={'save'} disabled={!canUse || !isDirty} />
          <IconButton role={'reset'} disabled={!canUse || !isDirty} onClick={() => reset()} />
        </FormControlRow>
      </FormTable>
    </form>
  </Segment>);
}

const ListExplanationWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
`;