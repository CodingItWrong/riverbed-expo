import {ResourceClient} from '@codingitwrong/jsonapi-client';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useMemo} from 'react';
import httpClient from './httpClient';
import {useToken} from './token';

export function useColumnClient() {
  const {token} = useToken();

  const columnClient = useMemo(() => {
    const client = httpClient({token});
    return new ResourceClient({name: 'columns', httpClient: client});
  }, [token]);

  return columnClient;
}

export function useColumns(board) {
  const columnClient = useColumnClient();
  return useQuery(['columns', board.id], () =>
    columnClient.related({parent: board}).then(resp => resp.data),
  );
}

export function useCreateColumn(board) {
  const columnClient = useColumnClient();
  return useMutation({
    mutationFn: () =>
      columnClient.create({
        relationships: {board: {data: {type: 'boards', id: board.id}}},
        attributes: {},
      }),
  });
}
