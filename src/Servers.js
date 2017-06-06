// @flow
import uuid from 'uuid';
import { validate, validateUniqueId } from './validators/Server';
import * as config from './Config';

type serverType = {
  id: string
};

export async function getAll() {
  const result = await config.get();
  return result.servers;
}

export async function add(server: serverType) {
  const srv = { ...server };
  await validate(srv);

  const data = await config.get();
  const newId = uuid.v4();
  validateUniqueId(data.servers, newId);

  srv.id = newId;
  data.servers.push(srv);
  await config.save(data);

  return srv;
}

export async function update(server: serverType) {
  await validate(server);

  const data = await config.get();
  validateUniqueId(data.servers, server.id);

  const index = await findServerIndexById(server.id);
  data.servers = [
    ...data.servers.slice(0, index),
    server,
    ...data.servers.slice(index + 1)
  ];

  await config.save(data);

  return server;
}

export function addOrUpdate(server: serverType) {
  const hasId = !!(server.id && String(server.id).length);
  // TODO: Add validation to check if the current id is a valid uuid
  return hasId ? update(server) : add(server);
}

async function findServerIndexById(id: string) {
  const data = await config.get();
  const index = data.servers.findIndex(srv => srv.id === id);

  if (index < 0) {
    throw new Error(`Server with id of "${id}" does not exist`);
  }

  return index;
}

export async function removeById(id: string) {
  const index = await findServerIndexById(id);
  const data = await config.get();

  data.servers = [
    ...data.servers.slice(0, index),
    ...data.servers.slice(index + 1)
  ];

  return config.save(data);
}
