import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root=process.cwd();const read=(path:string)=>readFileSync(join(root,path),"utf8");

describe("storage hardening",()=>{
 it("enforces aggregate project quotas in Postgres",()=>{
  const migration=read("supabase/migrations/20260829050000_storage_quotas.sql");
  expect(migration).toContain("existing_count >= 50");
  expect(migration).toContain("104857600");
  expect(migration).toContain("project_attachments_quota_guard");
  expect(migration).toContain("project_attachments_safe_filename");
 });
 it("keeps all user asset buckets private with authoritative MIME and size limits",()=>{
  const migration=read("supabase/migrations/20260829050000_storage_quotas.sql");
  expect(migration).toContain("('avatars','avatars',false,2097152");
  expect(migration).toContain("('team-assets','team-assets',false,4194304");
  expect(migration).toContain("('project-assets','project-assets',false,10485760");
 });
 it("forces signed project links to download rather than render inline",()=>{
  const panel=read("components/storage/ProjectFilesPanel.tsx");
  expect(panel).toContain("createSignedUrl(item.path, 900, { download: item.file_name })");
 });
 it("preflights the same quotas in the uploader for useful feedback",()=>{
  const uploader=read("components/storage/ProjectAttachmentUploader.tsx");
  expect(uploader).toContain("MAX_PROJECT_FILES=50");
  expect(uploader).toContain("MAX_PROJECT_BYTES=100*1024*1024");
  expect(uploader).toContain('from("project_attachments").select("size_bytes")');
 });
});
