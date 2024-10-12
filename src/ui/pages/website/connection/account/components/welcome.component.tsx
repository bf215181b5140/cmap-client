import { useContext } from 'react';
import { CredentialsContext } from '../../../../../components/context/credentials.context';
import TextButton from '../../../../../components/buttons/textButton.component';

export default function Welcome() {

  const { credentials, clearLoginToken } = useContext(CredentialsContext);

  return (<>
    <h2>Logged in as {credentials.displayName}</h2>
    <TextButton text={'Log out'} onClick={clearLoginToken} />
  </>);
}