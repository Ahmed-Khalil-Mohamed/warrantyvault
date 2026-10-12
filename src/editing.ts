import { z } from "zod";
import { DomainError, type Data, type Project } from "./contracts";

// Only independent descriptive fields are editable. Quantities, money,
// participants, workflow state and history must use their domain actions.
const editable: Record<string, string[]> = {
  queuewise: ["name", "service", "priority", "notes"],
  fixlane: ["title", "location", "category", "notes"],
  rescuetable: ["title", "donor", "location", "notes"],
  scopedesk: ["title", "client", "notes"],
  givetime: ["title", "location", "notes"],
  filenest: ["title", "extensions", "folder", "notes"],
  warrantyvault: ["title", "retailer", "serial", "notes"],
  stockroom: ["title", "reorder", "notes"],
  fairshare: ["title", "category", "notes"],
  recall: ["question", "answer", "topic"],
};

export function editFields(p: Project) {
  return p.fields.filter((field) => editable[p.id]?.includes(field.key));
}

export function editData(p: Project, data: Data, input: unknown): Data {
  if (data.kind === "settlement") throw new DomainError("invalid_transition");
  if (!(p.schema instanceof z.ZodObject))
    throw new Error("Missing edit schema");
  const schema = p.schema;
  const shape = Object.fromEntries(
    editFields(p).map((field) => [field.key, schema.shape[field.key]]),
  );
  const patch = z.object(shape).strict().parse(input);
  if (p.id === "filenest")
    patch.extensions = String(patch.extensions).toLowerCase();
  return { ...data, ...patch };
}
