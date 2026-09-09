import { useEffect, useRef, useState } from "react";
import {
  CloudUpload,
  Download,
  FileText,
  FileImage,
  File,
  FolderLock,
  ShieldCheck,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  addDoc,
  fmtBytes,
  listDocs,
  removeDoc,
  uid,
  type DocFile,
  type User,
} from "../lib/db";

interface Props {
  user: User;
  dbMode: "neon" | "local";
  notify: (msg: string, kind?: "ok" | "err") => void;
  onChange?: () => void;
}

const MAX_SIZE = 1.5 * 1024 * 1024; // 1.5 MB per file

/** Chrome blocks opening data: URLs in new tabs — convert to a blob: URL instead */
function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const head = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  const mime = head.match(/data:(.*?)(;|$)/)?.[1] || "application/octet-stream";
  let bytes: Uint8Array<ArrayBuffer>;
  if (head.includes(";base64")) {
    const bin = atob(body);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    bytes = arr;
  } else {
    bytes = new TextEncoder().encode(decodeURIComponent(body));
  }
  return new Blob([bytes], { type: mime });
}

export function openPreview(d: DocFile): boolean {
  try {
    const url = URL.createObjectURL(dataUrlToBlob(d.dataUrl));
    window.open(url, "_blank");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  } catch {
    return false;
  }
}

export default function Documents({ user, dbMode, notify, onChange }: Props) {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [booting, setBooting] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const used = docs.reduce((s, d) => s + d.size, 0);
  const quota = dbMode === "neon" ? 64 * 1024 * 1024 : 4.5 * 1024 * 1024;

  const refresh = async () => {
    try {
      setDocs(await listDocs(user.id));
    } catch {
      notify("Could not load your documents.", "err");
    } finally {
      setBooting(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const upload = (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setBusy(true);

    arr.forEach((file, idx) => {
      const last = idx === arr.length - 1;
      if (file.size > MAX_SIZE) {
        notify(`"${file.name}" is over 1.5 MB — split or compress it first.`, "err");
        if (last) setBusy(false);
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await addDoc({
            id: uid(),
            userId: user.id,
            name: file.name,
            mime: file.type || "application/octet-stream",
            size: file.size,
            dataUrl: String(reader.result),
            uploadedAt: Date.now(),
          });
          notify(
            `"${file.name}" sealed into your ${dbMode === "neon" ? "Neon cloud" : "local"} vault.`
          );
          await refresh();
          onChange?.();
        } catch {
          notify("Vault storage is full — delete older files first.", "err");
        } finally {
          if (last) setBusy(false);
        }
      };
      reader.onerror = () => {
        notify(`Could not read "${file.name}".`, "err");
        if (last) setBusy(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const del = async (d: DocFile) => {
    try {
      await removeDoc(d.id);
      notify(`"${d.name}" permanently deleted.`);
      await refresh();
      onChange?.();
    } catch {
      notify("Could not delete — database unreachable.", "err");
    }
  };

  const iconFor = (mime: string) =>
    mime.startsWith("image/") ? FileImage : mime.includes("pdf") ? FileText : File;

  return (
    <div>
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
            <FolderLock className="h-5.5 w-5.5 text-stone-900" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-serif text-[20px] font-semibold text-stone-900">Secure Document Vault</p>
            <p className="text-[12px] text-stone-500">
              {dbMode === "neon"
                ? "Stored as rows in your Neon Postgres database — dj_docs table."
                : "Stored only in this browser's private storage — connect Neon to sync everywhere."}
            </p>
          </div>
        </div>
        <div className="w-full sm:w-56">
          <div className="flex justify-between text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
            <span>{fmtBytes(used)} used</span>
            <span>{dbMode === "neon" ? "cloud vault" : `~${fmtBytes(quota)} vault`}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-stone-900 transition-all"
              style={{ width: `${Math.min(100, (used / quota) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        className={`relative mt-5 cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed px-8 py-14 text-center transition ${
          dragging
            ? "border-stone-900 bg-stone-100/60"
            : "border-stone-300 bg-white hover:border-stone-900"
        }`}
      >
        {busy && <div className="absolute inset-0 anim-shimmer" />}
        <CloudUpload className="mx-auto h-10 w-10 text-stone-400" strokeWidth={1.5} />
        <p className="mt-4 text-[15px] font-bold text-stone-900">
          Drop case documents here, or <span className="underline underline-offset-4">browse files</span>
        </p>
        <p className="mt-2 text-[12px] text-stone-500">
          PDF, images, Word files · up to 1.5 MB each · uploaded straight into the database
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Grid */}
      {booting ? (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-3xl border border-stone-200 bg-white py-16 text-[13px] font-semibold text-stone-500">
          <Loader2 className="h-4.5 w-4.5 animate-spin text-stone-900" />
          Reading your vault…
        </div>
      ) : docs.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-stone-200 bg-white/70 px-8 py-12 text-center">
          <p className="font-serif text-[19px] text-stone-900">The vault is empty.</p>
          <p className="mt-1.5 text-[12.5px] text-stone-500">
            Upload agreements, notices or ID proofs — share them with your advocate before the session.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => {
            const Icon = iconFor(d.mime);
            const isImg = d.mime.startsWith("image/");
            return (
              <div
                key={d.id}
                className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:border-stone-400"
              >
                <div className="relative flex h-32 items-center justify-center overflow-hidden bg-stone-100">
                  {isImg ? (
                    <img src={d.dataUrl} alt={d.name} className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-10 w-10 text-stone-400" strokeWidth={1.3} />
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-stone-900/90 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-white backdrop-blur">
                    {d.name.split(".").pop()?.slice(0, 5)}
                  </span>
                </div>
                <div className="p-4">
                  <p className="truncate text-[13px] font-bold text-stone-800" title={d.name}>
                    {d.name}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    {fmtBytes(d.size)} · {new Date(d.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                  <div className="mt-3.5 flex gap-2">
                    <a
                      href={d.dataUrl}
                      download={d.name}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-stone-300 py-2 text-[11px] font-bold text-stone-700 transition hover:border-stone-900"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                    {(isImg || d.mime.includes("pdf")) && (
                      <button
                        onClick={() => {
                          if (!openPreview(d)) {
                            notify("Preview blocked — allow pop-ups for this site.", "err");
                          }
                        }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-stone-300 py-2 text-[11px] font-bold text-stone-700 transition hover:border-stone-900"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Preview
                      </button>
                    )}
                    <button
                      onClick={() => del(d)}
                      className="flex items-center justify-center rounded-full border border-red-200 px-3.5 py-2 text-red-500 transition hover:bg-red-50"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 flex items-center gap-2 text-[11.5px] text-stone-400">
        <ShieldCheck className="h-4 w-4 text-gold-600" />
        Deleting your profile wipes every document row with it — nothing remains.
      </p>
    </div>
  );
}
