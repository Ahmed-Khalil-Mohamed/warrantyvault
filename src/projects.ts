import { warrantyvault } from "../apps/warrantyvault/domain";
export const projects = [warrantyvault];
export const findProject = (id: string) =>
  projects.find((project) => project.id === id);
