import { AuditLog } from "../models/index.js";

export async function createAuditLog({
  actor,
  action,
  entity,
  entityId,
  metadata,
  req,
}) {
  await AuditLog.create({
    actor: actor?._id,
    actorRole: actor?.role,
    action,
    entity,
    entityId: entityId ? String(entityId) : undefined,
    metadata,
    ipAddress: req?.ip,
    userAgent: req?.headers?.["user-agent"],
  });
}
