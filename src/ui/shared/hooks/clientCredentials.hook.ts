import React, { useEffect, useState } from 'react';
import { ClientCredentials } from '../../../shared/classes';

export interface ClientCredentialsHook {
    clientCredentials: ClientCredentials,
    setClientCredentials: React.Dispatch<React.SetStateAction<ClientCredentials>>,
    setClientToken: (token: string) => void,
}

export default function useClientCredentials() {

    const [clientCredentials, setClientCredentials] = useState<ClientCredentials>(new ClientCredentials());

    useEffect(() => {
        window.electronAPI.get('getClientCredentials')
            .then(result => {
                if (result != null) {
                    setClientCredentials(result);
                }
            });
    }, []);

    const setClientToken = (token: string) => {
        setClientCredentials({...clientCredentials, apiToken: token});
        window.electronAPI.send('setClientCredentials', {...clientCredentials, apiToken: token});
    };

    return {clientCredentials, setClientToken, setClientCredentials};
}
