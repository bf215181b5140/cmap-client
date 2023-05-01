import ContentBox from '../../shared/components/contentBox.component';
import React, { useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from 'cmap2-shared/dist/validationSchemas';
import FormInput from '../../shared/components/form/formInput.component';
import { ClientTier, InputType } from 'cmap2-shared';
import Content from '../../shared/components/content.component';
import useProlfilePage from './profile.hook';
import { FormTable, FormControl } from '../../shared/components/form/formTable.component';
import FileUpload from '../../shared/components/fileUpload.component';
import { ClientCredentialsContext } from '../../app/App';
import styled from 'styled-components';
import colors from 'cmap2-shared/src/colors.json';
import TierBadge from './components/tierBadge.component';
import ButtonStylePicker from "./buttonStylePicker/buttonStylePicker";
import BackgroundPicker from "./backgroundPicker/backgroundPicker.component";

export default function ProfilePage() {

    const {clientCredentials} = useContext(ClientCredentialsContext);
    const {client, backgrounds, buttonStyles, onSubmit, setClientPicture, setClientBackground, setClientButtonStyle} = useProlfilePage();
    const {register, setValue, formState: {errors}, handleSubmit} = useForm({resolver: zodResolver(profileSchema)});

    useEffect(() => {
        setValue('displayName', client?.displayName);
        setValue('bio', client?.bio);
        setValue('hidden', client?.hidden);
    }, [client]);

    return (
        <Content>
            <ContentBox flex={1} loading={!client}>
                {client && <>
                    <ProfilePictureStyled src={clientCredentials.serverUrl + '/' + client.picture} alt="Profile picture" />
                    <br/>
                    <FileUpload parentType="profile" parentId={client.id} uploadCallback={setClientPicture} />
                    <br/>
                    {client.tier && <>
                        <h3>Account tier</h3>
                        <TierBadge tier={client.tier} />
                    </>}
                </>}
            </ContentBox>
            <ContentBox loading={!client}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormTable>
                        <tr>
                            <th>Display name</th>
                            <td><FormInput type={InputType.Text} register={register} name={'displayName'} errors={errors} /></td>
                        </tr>
                        <tr>
                            <th>Bio</th>
                            <td><FormInput type={InputType.Textarea} register={register} name={'bio'} errors={errors} /></td>
                        </tr>
                        <tr>
                            <th>Hide profile</th>
                            <td><FormInput type={InputType.Boolean} register={register} name={'hidden'} errors={errors} /></td>
                        </tr>
                    </FormTable>
                    <FormControl><FormInput type={InputType.Submit} /></FormControl>
                </form>
            </ContentBox>
            <BackgroundPicker client={client} setFunction={setClientBackground} backgrounds={backgrounds} />
            <ButtonStylePicker client={client} setFunction={setClientButtonStyle} buttonStyles={buttonStyles} />
        </Content>
    );
}

const ProfilePictureStyled = styled.img`
  width: 100%;
  border: 3px solid ${colors['ui-primary-1']};
  border-radius: 8px;
  box-sizing: border-box;
  display: block;
`;

