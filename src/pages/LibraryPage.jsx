import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { db, storage } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  deleteObject,
} from "firebase/storage";
import PageShell from "../components/PageShell";

/* ── Tag colour map ── */
const TAG_COLORS = {
  Physics:   { bg: "bg-emerald-100 dark:bg-emerald-950/40",  text: "text-emerald-800 dark:text-emerald-300" },
  Research:  { bg: "bg-blue-100 dark:bg-blue-950/40",     text: "text-blue-800 dark:text-blue-300"    },
  Draft:     { bg: "bg-amber-100 dark:bg-amber-950/40",    text: "text-amber-800 dark:text-amber-300"   },
  Math:      { bg: "bg-purple-100 dark:bg-purple-950/40",   text: "text-purple-800 dark:text-purple-300"  },
  Chemistry: { bg: "bg-rose-100 dark:bg-rose-950/40",     text: "text-rose-800 dark:text-rose-300"    },
  Biology:   { bg: "bg-teal-100 dark:bg-teal-950/40",     text: "text-teal-800 dark:text-teal-300"    },
  Default:   { bg: "bg-gray-100 dark:bg-gray-800/40",     text: "text-gray-700 dark:text-gray-300"    },
};

function getTagColor(tag) {
  return TAG_COLORS[tag] || TAG_COLORS.Default;
}

/* ── Format bytes ── */
function fmtBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Format timestamp relative ── */
function fmtRelative(ts) {
  if (!ts) return "Just now";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ════════════════════════════════════════════
   FOLDER CARD
════════════════════════════════════════════ */
function FolderCard({ folder, onOpen, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className="card-static dark:bg-dm-surface dark:border-dm-border dark:hover:bg-dm-surface-hover rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200 cursor-pointer group relative animate-fade-in"
      onClick={() => onOpen(folder)}
    >
      {/* Three-dot menu */}
      <div
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id={`folder-menu-${folder.id}`}
          onClick={() => setMenuOpen((v) => !v)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant dark:text-dm-text-secondary hover:bg-surface-container-high dark:hover:bg-dm-surface-hover transition-colors"
        >
          <span className="material-symbols-outlined text-sm">more_vert</span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-dm-surface-elevated rounded-xl shadow-modal border border-border-default dark:border-dm-border w-36 z-50 animate-scale-in overflow-hidden">
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-on-surface dark:text-dm-text-primary hover:bg-surface-container-low dark:hover:bg-dm-surface-hover flex items-center gap-2"
              onClick={() => { setMenuOpen(false); onRename(folder); }}
            >
              <span className="material-symbols-outlined text-base">edit</span> Rename
            </button>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-dm-error-bg flex items-center gap-2"
              onClick={() => { setMenuOpen(false); onDelete(folder); }}
            >
              <span className="material-symbols-outlined text-base">delete</span> Delete
            </button>
          </div>
        )}
      </div>

      {/* Folder icon */}
      <div className="w-12 h-12 rounded-xl bg-primary-dark flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
      </div>
      <h4 className="font-bold text-on-surface dark:text-dm-text-primary text-sm mb-1 truncate pr-4">{folder.name}</h4>
      <p className="text-xs text-text-muted dark:text-dm-text-secondary">
        {folder.itemCount ?? 0} items • {fmtBytes(folder.totalSize ?? 0)}
      </p>
      {/* Progress bar */}
      <div className="mt-3 h-1 w-full bg-surface-container-high dark:bg-dm-border rounded-full overflow-hidden">
        <div
          className="h-full signature-gradient rounded-full transition-all duration-700"
          style={{ width: `${Math.min(((folder.itemCount ?? 0) / 20) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   NEW FOLDER CARD (dashed)
════════════════════════════════════════════ */
function NewFolderCard({ onClick }) {
  return (
    <button
      id="new-folder-btn"
      onClick={onClick}
      className="bg-white dark:bg-dm-surface rounded-2xl p-5 border-2 border-dashed border-border-default dark:border-dm-border hover:border-primary/40 dark:hover:border-primary/40 hover:bg-surface-container-low dark:hover:bg-dm-surface-hover hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[148px] w-full animate-fade-in"
    >
      <div className="w-10 h-10 rounded-xl bg-primary-container dark:bg-dm-primary-bg/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-xl">create_new_folder</span>
      </div>
      <span className="type-caption text-text-muted dark:text-dm-text-secondary">New Folder</span>
    </button>
  );
}

/* ════════════════════════════════════════════
   FILE ROW (list view)
════════════════════════════════════════════ */
function FileRow({ file, onDelete, onRename }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const tagColor = getTagColor(file.tag);

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-low dark:hover:bg-dm-surface-hover transition-colors group relative">
      {/* PDF icon */}
      <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-red-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <a
          href={file.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-on-surface dark:text-dm-text-primary text-sm hover:text-primary transition-colors truncate block"
          onClick={(e) => e.stopPropagation()}
        >
          {file.name}
        </a>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tagColor.bg} ${tagColor.text}`}>
            {file.tag || "PDF"}
          </span>
          <span className="text-xs text-text-muted dark:text-dm-text-secondary">
            Uploaded {fmtRelative(file.createdAt)} • {fmtBytes(file.size)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={file.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-surface-container-high dark:hover:bg-dm-surface-hover text-on-surface-variant dark:text-dm-text-secondary transition-colors"
          title="Preview/Download"
        >
          <span className="material-symbols-outlined text-base">open_in_new</span>
        </a>
        <button
          onClick={() => onRename(file)}
          className="p-1.5 rounded-lg hover:bg-surface-container-high dark:hover:bg-dm-surface-hover text-on-surface-variant dark:text-dm-text-secondary transition-colors"
          title="Rename"
        >
          <span className="material-symbols-outlined text-base">edit</span>
        </button>
        <button
          onClick={() => onDelete(file)}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-dm-error-bg text-red-400 transition-colors"
          title="Delete"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   FILE GRID CARD
════════════════════════════════════════════ */
function FileCard({ file, onDelete, onRename }) {
  const tagColor = getTagColor(file.tag);
  return (
    <div className="card-static dark:bg-dm-surface dark:border-dm-border dark:hover:bg-dm-surface-hover rounded-2xl p-4 hover:-translate-y-1 transition-all duration-200 group animate-fade-in">
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
          <span className="material-symbols-outlined text-red-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a href={file.downloadUrl} target="_blank" rel="noopener noreferrer"
            className="p-1 rounded-lg hover:bg-surface-container-high dark:hover:bg-dm-surface-hover text-on-surface-variant dark:text-dm-text-secondary transition-colors">
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </a>
          <button onClick={() => onRename(file)} className="p-1 rounded-lg hover:bg-surface-container-high dark:hover:bg-dm-surface-hover text-on-surface-variant dark:text-dm-text-secondary transition-colors">
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button onClick={() => onDelete(file)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-dm-error-bg text-red-400 transition-colors">
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
      <p className="font-semibold text-on-surface dark:text-dm-text-primary text-sm truncate">{file.name}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={`text-[0.55rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tagColor.bg} ${tagColor.text}`}>
          {file.tag || "PDF"}
        </span>
        <span className="text-[0.65rem] text-text-muted">{fmtBytes(file.size)}</span>
      </div>
      <p className="text-[0.65rem] text-text-muted mt-1">{fmtRelative(file.createdAt)}</p>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN: LibraryPage
════════════════════════════════════════════ */
export default function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ── UI state ── */
  const [viewMode, setViewMode]           = useState("list"); // "list" | "grid"
  const [searchQuery, setSearchQuery]     = useState("");
  const [sortMode, setSortMode]           = useState("modified"); // "modified" | "name"
  const [showAddMenu, setShowAddMenu]     = useState(false);
  const addMenuRef                        = useRef(null);

  /* ── Navigation state ── */
  const [breadcrumb, setBreadcrumb] = useState([{ id: null, name: "Library" }]);
  const currentFolder = breadcrumb[breadcrumb.length - 1];

  /* ── Folder state ── */
  const [folders, setFolders] = useState([]);
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);

  /* ── Modals ── */
  const [showNewFolderModal,  setShowNewFolderModal]  = useState(false);
  const [showRenameModal,     setShowRenameModal]     = useState(false);
  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false);
  const [showUploadModal,     setShowUploadModal]     = useState(false);
  const [selectedItem,        setSelectedItem]        = useState(null);
  const [renameValue,         setRenameValue]         = useState("");
  const [newFolderName,       setNewFolderName]       = useState("");

  /* ── Upload state ── */
  const [uploadFile,          setUploadFile]          = useState(null);
  const [uploadTag,           setUploadTag]           = useState("Draft");
  const [uploadProgress,      setUploadProgress]      = useState(0);
  const [uploading,           setUploading]           = useState(false);
  const [uploadError,         setUploadError]         = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => { document.title = "StudySync - Library"; }, []);

  /* ── Close add-menu on outside click ── */
  useEffect(() => {
    function handler(e) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) setShowAddMenu(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ══════════════════ Firestore: Folders ══════════════════ */
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setFirestoreError(null);

    const q = query(
      collection(db, "library_folders"),
      where("userId", "==", user.uid),
      where("parentId", "==", currentFolder.id ?? "root")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFolders(data);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error listening to library_folders:", err);
      setFirestoreError(err.message || String(err));
      setLoading(false);
    });
    return unsub;
  }, [user, currentFolder.id]);

  /* ══════════════════ Firestore: Files ══════════════════ */
  useEffect(() => {
    if (!user) return;
    setFirestoreError(null);

    const q = query(
      collection(db, "library_files"),
      where("userId", "==", user.uid),
      where("folderId", "==", currentFolder.id ?? "root")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFiles(data);
    }, (err) => {
      console.error("Firestore error listening to library_files:", err);
      setFirestoreError(err.message || String(err));
    });
    return unsub;
  }, [user, currentFolder.id]);

  /* ══════════════════ Create Folder ══════════════════ */
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    await addDoc(collection(db, "library_folders"), {
      name: newFolderName.trim(),
      userId: user.uid,
      parentId: currentFolder.id ?? "root",
      itemCount: 0,
      totalSize: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setNewFolderName("");
    setShowNewFolderModal(false);
  };

  /* ══════════════════ Navigate into folder ══════════════════ */
  const openFolder = useCallback((folder) => {
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }, []);

  const navigateBreadcrumb = useCallback((index) => {
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  }, []);

  /* ══════════════════ Upload PDF (base64 in Firestore) ══════════════════ */
  const resetUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadProgress(0);
    setUploading(false);
    setUploadError("");
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    // Firestore doc limit is 1 MB; base64 expands ~33%, so cap at 700 KB
    if (uploadFile.size > 700 * 1024) {
      setUploadError(`File too large (${fmtBytes(uploadFile.size)}). Max size is 700 KB. Please compress the PDF first.`);
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadProgress(10);

    try {
      // Read file as base64 data URL
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(uploadFile);
      });

      setUploadProgress(60);

      // Store directly in Firestore (no Storage, no CORS)
      await addDoc(collection(db, "library_files"), {
        name: uploadFile.name,
        userId: user.uid,
        folderId: currentFolder.id ?? "root",
        downloadUrl: base64,          // data URL — works directly in <a href> and <iframe>
        size: uploadFile.size,
        tag: uploadTag,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setUploadProgress(100);
      setTimeout(resetUploadModal, 300);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError(err?.message || "Upload failed. Please try again.");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /* ══════════════════ Rename ══════════════════ */
  const doRename = async () => {
    if (!selectedItem || !renameValue.trim()) return;
    const coll = selectedItem._type === "folder" ? "library_folders" : "library_files";
    await updateDoc(doc(db, coll, selectedItem.id), {
      name: renameValue.trim(),
      updatedAt: serverTimestamp(),
    });
    setShowRenameModal(false);
    setSelectedItem(null);
    setRenameValue("");
  };

  /* ══════════════════ Delete ══════════════════ */
  const doDelete = async () => {
    if (!selectedItem) return;
    if (selectedItem._type === "folder") {
      await deleteDoc(doc(db, "library_folders", selectedItem.id));
    } else {
      // delete from storage too
      if (selectedItem.storagePath) {
        try { await deleteObject(ref(storage, selectedItem.storagePath)); } catch (_) {}
      }
      await deleteDoc(doc(db, "library_files", selectedItem.id));
    }
    setShowDeleteConfirm(false);
    setSelectedItem(null);
  };

  /* ── Helpers to open modals ── */
  const startRename = (item, type) => {
    setSelectedItem({ ...item, _type: type });
    setRenameValue(item.name);
    setShowRenameModal(true);
  };

  const startDelete = (item, type) => {
    setSelectedItem({ ...item, _type: type });
    setShowDeleteConfirm(true);
  };

  /* ── Filtered & sorted lists ── */
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = files
    .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      const aTime = a.updatedAt?.toMillis?.() ?? 0;
      const bTime = b.updatedAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });

  /* ══════════════════ RENDER ══════════════════ */
  const topBarContent = (
    <>
      {/* Search bar */}
      <div className="relative flex-1 max-w-xl">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg">search</span>
        <input
          id="library-search"
          type="text"
          placeholder="Search in Library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-dm-surface border border-border-default dark:border-dm-border rounded-xl pl-11 pr-5 py-2.5 text-sm text-on-surface dark:text-dm-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-sm"
        />
      </div>

      {/* Add Material button */}
      <div className="relative" ref={addMenuRef}>
        <button
          id="add-material-btn"
          onClick={() => setShowAddMenu((v) => !v)}
          className="flex items-center gap-2 signature-gradient text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add Material
        </button>
        {showAddMenu && (
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-dm-surface-elevated rounded-xl shadow-modal border border-border-default dark:border-dm-border w-48 z-50 animate-scale-in overflow-hidden">
            <button
              id="upload-pdf-option"
              onClick={() => { setShowAddMenu(false); setShowUploadModal(true); }}
              className="w-full text-left px-5 py-3.5 text-sm text-on-surface dark:text-dm-text-primary hover:bg-surface-container-low dark:hover:bg-dm-surface-hover flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
              Upload PDF
            </button>
            <button
              id="create-folder-option"
              onClick={() => { setShowAddMenu(false); setShowNewFolderModal(true); }}
              className="w-full text-left px-5 py-3.5 text-sm text-on-surface dark:text-dm-text-primary hover:bg-surface-container-low dark:hover:bg-dm-surface-hover flex items-center gap-3 border-t border-border-default dark:border-dm-border"
            >
              <span className="material-symbols-outlined text-primary">create_new_folder</span>
              Create Folder
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <PageShell
      activePage="library"
      title="Library"
      subtitle="Your study materials, organized"
      topBarChildren={topBarContent}
    >
      <div className="animate-page-enter max-w-7xl mx-auto">
        {/* ── Breadcrumb + Controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm flex-wrap" aria-label="breadcrumb">
            {breadcrumb.map((crumb, idx) => (
              <span key={crumb.id ?? "root"} className="flex items-center gap-1">
                {idx > 0 && (
                  <span className="material-symbols-outlined text-text-muted text-sm">chevron_right</span>
                )}
                {idx < breadcrumb.length - 1 ? (
                  <button
                    onClick={() => navigateBreadcrumb(idx)}
                    className="text-primary hover:text-primary-dark font-medium transition-colors"
                  >
                    {crumb.name}
                  </button>
                ) : (
                  <span className="font-bold text-on-surface">{crumb.name}</span>
                )}
              </span>
            ))}
          </nav>

          {/* Sort + View toggle */}
          <div className="flex items-center gap-2">
            <button
              id="sort-last-modified"
              onClick={() => setSortMode((v) => (v === "modified" ? "name" : "modified"))}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dm-surface border border-border-default dark:border-dm-border rounded-xl text-xs font-semibold text-on-surface-variant dark:text-dm-text-secondary hover:bg-surface-container-low dark:hover:bg-dm-surface-hover transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-base">filter_list</span>
              {sortMode === "modified" ? "Last Modified" : "Name A–Z"}
            </button>
            <button
              id="toggle-view-grid"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl border transition-colors ${viewMode === "grid" ? "bg-primary text-white border-primary" : "bg-white dark:bg-dm-surface border-border-default dark:border-dm-border text-on-surface-variant dark:text-dm-text-secondary hover:bg-surface-container-low dark:hover:bg-dm-surface-hover"}`}
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
            <button
              id="toggle-view-list"
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl border transition-colors ${viewMode === "list" ? "bg-primary text-white border-primary" : "bg-white dark:bg-dm-surface border-border-default dark:border-dm-border text-on-surface-variant dark:text-dm-text-secondary hover:bg-surface-container-low dark:hover:bg-dm-surface-hover"}`}
            >
              <span className="material-symbols-outlined text-base">view_list</span>
            </button>
          </div>
        </div>

        {firestoreError && (
          <div className="mb-6 p-5 bg-red-50 dark:bg-dm-error-bg border border-red-200 dark:border-red-950/30 rounded-2xl flex gap-3.5 items-start animate-fade-in text-red-950 dark:text-dm-text-primary shadow-sm">
            <span className="material-symbols-outlined text-red-500 dark:text-dm-error text-2xl flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-red-900 dark:text-dm-text-primary">Firestore Security Rules Issue Detected</h4>
              <p className="text-xs text-red-700 dark:text-dm-text-secondary mt-1 leading-relaxed">
                The database returned a permission denied error: <code className="bg-red-100/50 dark:bg-dm-bg px-1 py-0.5 rounded font-mono break-all">{firestoreError}</code>.
              </p>
              <div className="mt-4 p-4 bg-white/70 dark:bg-dm-surface rounded-xl border border-red-100 dark:border-dm-border">
                <p className="text-xs font-bold text-red-900 dark:text-dm-text-primary mb-2">How to Fix in Firebase Console:</p>
                <p className="text-xs text-red-800 dark:text-dm-text-secondary leading-relaxed mb-2">
                  Go to <span className="font-bold">Firestore Database → Rules</span> and add read/write rules for <code className="bg-red-50 dark:bg-dm-bg px-1 rounded font-mono">library_folders</code> and <code className="bg-red-50 dark:bg-dm-bg px-1 rounded font-mono">library_files</code>:
                </p>
                <pre className="text-[10px] bg-red-950 dark:bg-dm-bg text-red-100 dark:text-dm-text-green p-3 rounded-lg overflow-x-auto font-mono leading-normal select-all">
{`match /library_folders/{folderId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
}
match /library_files/{fileId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ── Content Card ── */}
        <div className="card-static dark:bg-dm-surface dark:border-dm-border rounded-2xl p-6 lg:p-8">

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="material-symbols-outlined text-5xl text-primary/30 animate-spin">progress_activity</span>
            </div>
          ) : (
            <>
              {/* ── Folders Section ── */}
              {filteredFolders.length > 0 || true /* always show section */ ? (
                <section className="mb-10">
                  <h2 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 dark:text-dm-text-secondary mb-5">Folders</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        onOpen={openFolder}
                        onRename={(f) => startRename(f, "folder")}
                        onDelete={(f) => startDelete(f, "folder")}
                      />
                    ))}
                    <NewFolderCard onClick={() => setShowNewFolderModal(true)} />
                  </div>
                </section>
              ) : null}

              {/* ── Files Section ── */}
              <section>
                <h2 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 dark:text-dm-text-secondary mb-5">Files</h2>
                {filteredFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-dm-surface-elevated flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-emerald-300 dark:text-dm-text-secondary text-3xl">folder_open</span>
                    </div>
                    <p className="text-on-surface-variant dark:text-dm-text-primary font-medium text-sm">No files here yet</p>
                    <p className="text-on-surface-variant/60 dark:text-dm-text-secondary text-xs mt-1">Upload a PDF using the "Add Material" button</p>
                  </div>
                ) : viewMode === "list" ? (
                  <div className="divide-y divide-emerald-50 dark:divide-dm-border stagger-children">
                    {filteredFiles.map((file) => (
                      <FileRow
                        key={file.id}
                        file={file}
                        onDelete={(f) => startDelete(f, "file")}
                        onRename={(f) => startRename(f, "file")}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 stagger-children">
                    {filteredFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        onDelete={(f) => startDelete(f, "file")}
                        onRename={(f) => startRename(f, "file")}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════ MODAL: New Folder ══════════════════ */}
      {showNewFolderModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-6" onClick={() => setShowNewFolderModal(false)}>
          <div className="bg-white dark:bg-dm-surface-elevated border border-border-default dark:border-dm-border rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-dm-primary-bg/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 dark:text-dm-text-green">create_new_folder</span>
              </div>
              <h3 className="text-lg font-bold text-emerald-900 dark:text-dm-text-primary">New Folder</h3>
            </div>
            <input
              id="new-folder-name-input"
              autoFocus
              className="w-full bg-white dark:bg-dm-surface border border-emerald-200 dark:border-dm-border rounded-xl px-4 py-3 text-sm text-emerald-900 dark:text-dm-text-primary placeholder:text-emerald-400/60 dark:placeholder:text-dm-text-tertiary focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all mb-6"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowNewFolderModal(false); setNewFolderName(""); }}
                className="px-5 py-2.5 rounded-xl text-emerald-700 dark:text-dm-text-secondary font-semibold text-sm hover:bg-emerald-50 dark:hover:bg-dm-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                id="create-folder-submit"
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="px-6 py-2.5 rounded-xl signature-gradient text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL: Upload PDF ══════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-6" onClick={() => !uploading && resetUploadModal()}>
          <div className="bg-white dark:bg-dm-surface-elevated border border-border-default dark:border-dm-border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
              </div>
              <h3 className="text-lg font-bold text-emerald-900 dark:text-dm-text-primary">Upload PDF</h3>
            </div>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors mb-4 ${
                uploadFile
                  ? "border-emerald-400 bg-emerald-50 dark:bg-dm-primary-bg/25 dark:border-emerald-600"
                  : "border-emerald-200 dark:border-dm-border hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-dm-surface-hover"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f && f.type === "application/pdf") setUploadFile(f);
              }}
            >
              <input
                id="pdf-file-input"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files[0] ?? null)}
              />
              {uploadFile ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-red-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                  <p className="font-semibold text-emerald-900 dark:text-dm-text-primary text-sm">{uploadFile.name}</p>
                  <p className="text-xs text-emerald-600/60 dark:text-dm-text-secondary">{fmtBytes(uploadFile.size)}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-300 dark:text-dm-text-secondary text-4xl">upload_file</span>
                  <p className="font-semibold text-emerald-700 dark:text-dm-text-primary text-sm">Click or drag PDF here</p>
                  <p className="text-xs text-emerald-500/60 dark:text-dm-text-secondary">Only PDF files supported</p>
                </div>
              )}
            </div>

            {/* Tag selector */}
            <div className="mb-6">
              <label className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 dark:text-dm-text-secondary mb-2 block">Tag</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(TAG_COLORS).filter(t => t !== "Default").map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setUploadTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      uploadTag === tag
                        ? "signature-gradient text-white shadow-md"
                        : `${TAG_COLORS[tag].bg} ${TAG_COLORS[tag].text} hover:opacity-80`
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-emerald-700 dark:text-dm-text-secondary mb-1">
                  <span>Uploading...</span><span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-emerald-100 dark:bg-dm-border rounded-full overflow-hidden">
                  <div
                    className="h-full signature-gradient rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error banner */}
            {uploadError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-dm-error-bg border border-red-200 dark:border-red-950/30 rounded-xl flex gap-3 items-start animate-fade-in">
                <span className="material-symbols-outlined text-red-400 dark:text-dm-error text-xl flex-shrink-0 mt-0.5">error</span>
                <div>
                  <p className="text-red-700 dark:text-dm-text-primary font-semibold text-sm">Upload Failed</p>
                  <p className="text-red-600/80 dark:text-dm-text-secondary text-xs mt-0.5 leading-relaxed">{uploadError}</p>
                  {uploadError.includes("CORS") && (
                    <a
                      href="https://firebase.google.com/docs/storage/web/start#cors"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-red-700 dark:text-red-400 underline mt-1 inline-block"
                    >
                      Fix CORS → Firebase Docs
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={resetUploadModal}
                disabled={uploading}
                className="px-5 py-2.5 rounded-xl text-emerald-700 dark:text-dm-text-secondary font-semibold text-sm hover:bg-emerald-50 dark:hover:bg-dm-surface-hover transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                id="upload-pdf-submit"
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="px-6 py-2.5 rounded-xl signature-gradient text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
              >
                {uploading ? (
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-base">upload</span>
                )}
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL: Rename ══════════════════ */}
      {showRenameModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-6" onClick={() => setShowRenameModal(false)}>
          <div className="bg-white dark:bg-dm-surface-elevated border border-border-default dark:border-dm-border rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-emerald-900 dark:text-dm-text-primary mb-6">
              Rename {selectedItem?._type === "folder" ? "Folder" : "File"}
            </h3>
            <input
              autoFocus
              className="w-full bg-white dark:bg-dm-surface border border-emerald-200 dark:border-dm-border rounded-xl px-4 py-3 text-sm text-emerald-900 dark:text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all mb-6"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doRename()}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRenameModal(false)} className="px-5 py-2.5 rounded-xl text-emerald-700 dark:text-dm-text-secondary font-semibold text-sm hover:bg-emerald-50 dark:hover:bg-dm-surface-hover transition-colors">
                Cancel
              </button>
              <button
                onClick={doRename}
                disabled={!renameValue.trim()}
                className="px-6 py-2.5 rounded-xl signature-gradient text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL: Delete Confirm ══════════════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-6" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-dm-surface-elevated border border-border-default dark:border-dm-border rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-dm-error-bg flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-red-400 text-2xl">delete</span>
            </div>
            <h3 className="text-lg font-bold text-emerald-900 dark:text-dm-text-primary text-center mb-2">
              Delete {selectedItem?._type === "folder" ? "Folder" : "File"}?
            </h3>
            <p className="text-sm text-emerald-600/70 dark:text-dm-text-secondary text-center mb-8">
              "<span className="font-semibold">{selectedItem?.name}</span>" will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2.5 rounded-xl border border-emerald-200 dark:border-dm-border text-emerald-800 dark:text-dm-text-secondary font-semibold text-sm hover:bg-emerald-50 dark:hover:bg-dm-surface-hover transition-colors">
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightning FAB (consistent with Dashboard) ── */}
      <button
        id="library-fab"
        onClick={() => setShowAddMenu(true)}
        className="fixed bottom-10 right-10 w-14 h-14 rounded-full signature-gradient text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-50"
      >
        <span className="material-symbols-outlined text-2xl">bolt</span>
      </button>
    </PageShell>
  );
}
