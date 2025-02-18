import TypedEmitter from 'typed-emitter/rxjs';
import { useContext, useEffect, useState } from 'react';
import { PresetDTO, UploadedFileDTO } from 'cmap2-shared';
import { PresetButton } from 'cmap2-shared/react';
import { PresetsSectionEvents } from '../presets.model';
import { LayoutsPageContext } from '../../../layouts.context';
import Segment from '../../../../../../components/segment/segment.component';

interface PresetPreviewProps {
  presetSectionEvents: TypedEmitter<PresetsSectionEvents>;
  preset: PresetDTO;
}

export default function PresetPreview({ presetSectionEvents, preset }: PresetPreviewProps) {

  const { theme } = useContext(LayoutsPageContext);
  const [previewPreset, setPreviewPreset] = useState<PresetDTO>(preset);

  useEffect(() => {
    function onPresetFormChanged(formPreset: PresetDTO) {
      setPreviewPreset(state => ({ ...formPreset, image: state?.image }));
    }

    function onImageChanged(image: UploadedFileDTO | null) {
      setPreviewPreset(state => {
        if (state) return { ...state, image };
        return state;
      });
    }

    presetSectionEvents.on('onFormChange', onPresetFormChanged);
    presetSectionEvents.on('onImageChange', onImageChanged);

    return () => {
      presetSectionEvents.removeListener('onFormChange', onPresetFormChanged);
      presetSectionEvents.removeListener('onImageChange', onImageChanged);
    };
  }, []);

  useEffect(() => {
    setPreviewPreset(preset);
  }, [preset]);

  if (!previewPreset) return;

  return (<Segment segmentTitle={'Preview'} width={'Full'}>
    <div style={{ maxWidth: '350px' }}>
      <PresetButton theme={theme} preset={previewPreset} />
    </div>
  </Segment>);
}
