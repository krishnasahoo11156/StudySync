import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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

/* ── Tag colour map ── */
const TAG_COLORS = {
  Physics:   { bg: "bg-emerald-100",  text: "text-emerald-800" },
  Research:  { bg: "bg-blue-100",     text: "text-blue-800"    },
  Draft:     { bg: "bg-amber-100",    text: "text-amber-800"   },
  Math:      { bg: "bg-purple-100",   text: "text-purple-800"  },
  Chemistry: { bg: "bg-rose-100",     text: "text-rose-800"    },
  Biology:   { bg: "bg-teal-100",     text: "text-teal-800"    },
  Default:   { bg: "bg-gray-100",     text: "text-gray-700"    },
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
   SIDEBAR (shared shell — mirrors Dashboard)
════════════════════════════════════════════ */
function Sidebar({ sidebarOpen, setSidebarOpen, userName, greeting, onLogout, navigate }) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-emerald-50 rounded-r-3xl flex flex-col p-6 gap-4 z-40 shadow-xl shadow-emerald-900/5 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="mb-2 px-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl signature-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">school</span>
            </div>
            <div>
              <span className="text-lg font-extrabold text-emerald-900 leading-none">StudySync</span>
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-emerald-600/70">Your Verdant Sanctuary</p>
            </div>
          </div>
          <button className="lg:hidden text-emerald-700" onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* User avatar */}
        <div className="mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center text-on-primary text-lg font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-on-surface font-bold text-sm">{greeting}, {userName}</h3>
              <p className="text-on-surface-variant text-xs opacity-70">Ready for a deep breath?</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-4 px-4 py-3 text-emerald-700/70 hover:bg-emerald-100 transition-all rounded-xl w-full text-left"
          >
            <span className="material-symbols-outlined">home</span>
            <span className="font-semibold tracking-wide text-sm">Sanctuary</span>
          </button>
          {/* Library — ACTIVE */}
          <div className="flex items-center gap-4 px-4 py-3 bg-emerald-800 text-white rounded-xl">
            <span className="material-symbols-outlined">menu_book</span>
            <span className="font-semibold tracking-wide text-sm">Library</span>
          </div>
          {[
            { icon: "timer",     label: "Focus"     },
            { icon: "bar_chart", label: "Analytics" },
            { icon: "groups",    label: "Community" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-4 px-4 py-3 text-emerald-700/70 hover:bg-emerald-100 transition-all rounded-xl w-full text-left"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-semibold tracking-wide text-sm">{item.label}</span>
            </button>
          ))}

          <div className="flex-1" />

          {/* Start Focus Session */}
          <button className="mx-2 my-2 py-3 px-4 rounded-xl signature-gradient text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all">
            Start Focus Session
          </button>

          <button className="flex items-center gap-4 px-4 py-3 text-emerald-700/70 hover:bg-emerald-100 transition-all rounded-xl w-full text-left">
            <span className="material-symbols-outlined">help_outline</span>
            <span className="font-semibold tracking-wide text-sm">Help</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-4 px-4 py-3 text-emerald-700/70 hover:bg-emerald-100 transition-all rounded-xl w-full text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-semibold tracking-wide text-sm">Sign Out</span>
          </button>
        </nav>
      </aside>
    </>
  );
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
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer group relative border border-emerald-50 animate-fade-in"
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
          className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-700/50 hover:bg-emerald-100 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">more_vert</span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-emerald-100 w-36 z-50 animate-scale-in overflow-hidden">
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-emerald-50 flex items-center gap-2"
              onClick={() => { setMenuOpen(false); onRename(folder); }}
            >
              <span className="material-symbols-outlined text-base">edit</span> Rename
            </button>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={() => { setMenuOpen(false); onDelete(folder); }}
            >
              <span className="material-symbols-outlined text-base">delete</span> Delete
            </button>
          </div>
        )}
      </div>

      {/* Folder icon */}
      <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
      </div>
      <h4 className="font-bold text-emerald-900 text-sm mb-1 truncate pr-4">{folder.name}</h4>
      <p className="text-xs text-emerald-600/60">
        {folder.itemCount ?? 0} items • {fmtBytes(folder.totalSize ?? 0)}
      </p>
      {/* Progress bar */}
      <div className="mt-3 h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
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
      className="bg-white rounded-2xl p-5 border-2 border-dashed border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[148px] w-full animate-fade-in"
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
        <span className="material-symbols-outlined text-emerald-600 text-xl">create_new_folder</span>
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600/60">New Folder</span>
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
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-emerald-50 transition-colors group relative">
      {/* PDF icon */}
      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-red-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <a
          href={file.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-emerald-900 text-sm hover:text-emerald-700 truncate block"
          onClick={(e) => e.stopPropagation()}
        >
          {file.name}
        </a>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tagColor.bg} ${tagColor.text}`}>
            {file.tag || "PDF"}
          </span>
          <span className="text-xs text-emerald-600/50">
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
          className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
          title="Preview/Download"
        >
          <span className="material-symbols-outlined text-base">open_in_new</span>
        </a>
        <button
          onClick={() => onRename(file)}
          className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
          title="Rename"
        >
          <span className="material-symbols-outlined text-base">edit</span>
        </button>
        <button
          onClick={() => onDelete(file)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
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
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group border border-emerald-50 animate-fade-in">
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-red-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a href={file.downloadUrl} target="_blank" rel="noopener noreferrer"
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors">
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </a>
          <button onClick={() => onRename(file)} className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors">
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button onClick={() => onDelete(file)} className="p-1 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
      <p className="font-semibold text-emerald-900 text-sm truncate">{file.name}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={`text-[0.55rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tagColor.bg} ${tagColor.text}`}>
          {file.tag || "PDF"}
        </span>
        <span className="text-[0.65rem] text-emerald-600/50">{fmtBytes(file.size)}</span>
      </div>
      <p className="text-[0.65rem] text-emerald-600/40 mt-1">{fmtRelative(file.createdAt)}</p>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN: LibraryPage
════════════════════════════════════════════ */
export default function LibraryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ── UI state ── */
  const [sidebarOpen, setSidebarOpen]     = useState(false);
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

  /* ── Modals ── */
  const [showNewFolderModal,  setShowNewFolderModal]  = useState(false);
  const [showRenameModal,     setShowRenameModal]     = useState(false);
  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false);
  const [showUploadModal,     setShowUploadModal]     = useState(false);
  const [selectedItem,        setSelectedItem]        = useState(null); // folder or file being acted on
  const [renameValue,         setRenameValue]         = useState("");
  const [newFolderName,       setNewFolderName]       = useState("");

  /* ── Upload state ── */
  const [uploadFile,          setUploadFile]          = useState(null);
  const [uploadTag,           setUploadTag]           = useState("Draft");
  const [uploadProgress,      setUploadProgress]      = useState(0);
  const [uploading,           setUploading]           = useState(false);
  const [uploadError,         setUploadError]         = useState("");
  const fileInputRef = useRef(null);

  /* ── Greeting ── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const userName = user?.displayName || user?.email?.split("@")[0] || "Student";

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

    const q = query(
      collection(db, "library_folders"),
      where("userId", "==", user.uid),
      where("parentId", "==", currentFolder.id ?? "root")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFolders(data);
      setLoading(false);
    });
    return unsub;
  }, [user, currentFolder.id]);

  /* ══════════════════ Firestore: Files ══════════════════ */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "library_files"),
      where("userId", "==", user.uid),
      where("folderId", "==", currentFolder.id ?? "root")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFiles(data);
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

  const handleLogout = async () => { await logout(); navigate("/"); };

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className="bg-surface text-on-surface min-h-screen">

      {/* ── Sidebar ── */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userName={userName}
        greeting={greeting}
        onLogout={handleLogout}
        navigate={navigate}
      />

      {/* ── Main content ── */}
      <main className="lg:ml-72 min-h-screen relative">

        {/* ── Top Bar ── */}
        <header className="fixed top-0 left-0 lg:left-72 right-0 z-30 h-20 bg-emerald-50/80 backdrop-blur-xl flex items-center px-6 lg:px-8 gap-4">
          {/* Hamburger (mobile) */}
          <button className="lg:hidden text-emerald-700" onClick={() => setSidebarOpen(true)}>
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-lg">search</span>
            <input
              id="library-search"
              type="text"
              placeholder="Search in Library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-emerald-100 rounded-2xl pl-11 pr-5 py-2.5 text-sm text-emerald-900 placeholder:text-emerald-400/70 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all shadow-sm"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

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
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-emerald-100 w-48 z-50 animate-scale-in overflow-hidden">
                <button
                  id="upload-pdf-option"
                  onClick={() => { setShowAddMenu(false); setShowUploadModal(true); }}
                  className="w-full text-left px-5 py-3.5 text-sm text-on-surface hover:bg-emerald-50 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
                  Upload PDF
                </button>
                <button
                  id="create-folder-option"
                  onClick={() => { setShowAddMenu(false); setShowNewFolderModal(true); }}
                  className="w-full text-left px-5 py-3.5 text-sm text-on-surface hover:bg-emerald-50 flex items-center gap-3 border-t border-emerald-50"
                >
                  <span className="material-symbols-outlined text-emerald-600">create_new_folder</span>
                  Create Folder
                </button>
              </div>
            )}
          </div>

          {/* Notification + Settings icons */}
          <button className="p-2 text-emerald-700/60 hover:bg-emerald-100 rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-emerald-700/60 hover:bg-emerald-100 rounded-full transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-9 h-9 rounded-full signature-gradient flex items-center justify-center text-white font-bold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* ── Page Body ── */}
        <div className="pt-24 px-6 lg:px-10 pb-12">

          {/* ── Breadcrumb + Controls ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm flex-wrap" aria-label="breadcrumb">
              {breadcrumb.map((crumb, idx) => (
                <span key={crumb.id ?? "root"} className="flex items-center gap-1">
                  {idx > 0 && (
                    <span className="material-symbols-outlined text-emerald-400 text-sm">chevron_right</span>
                  )}
                  {idx < breadcrumb.length - 1 ? (
                    <button
                      onClick={() => navigateBreadcrumb(idx)}
                      className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                    >
                      {crumb.name}
                    </button>
                  ) : (
                    <span className="font-bold text-emerald-900">{crumb.name}</span>
                  )}
                </span>
              ))}
            </nav>

            {/* Sort + View toggle */}
            <div className="flex items-center gap-2">
              <button
                id="sort-last-modified"
                onClick={() => setSortMode((v) => (v === "modified" ? "name" : "modified"))}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-base">filter_list</span>
                {sortMode === "modified" ? "Last Modified" : "Name A–Z"}
              </button>
              <button
                id="toggle-view-grid"
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl border transition-colors ${viewMode === "grid" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50"}`}
              >
                <span className="material-symbols-outlined text-base">grid_view</span>
              </button>
              <button
                id="toggle-view-list"
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl border transition-colors ${viewMode === "list" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50"}`}
              >
                <span className="material-symbols-outlined text-base">view_list</span>
              </button>
            </div>
          </div>

          {/* ── Content Card ── */}
          <div className="bg-white rounded-3xl shadow-sm p-6 lg:p-8 border border-emerald-50">

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <span className="material-symbols-outlined text-5xl text-primary/30 animate-spin">progress_activity</span>
              </div>
            ) : (
              <>
                {/* ── Folders Section ── */}
                {filteredFolders.length > 0 || true /* always show section */ ? (
                  <section className="mb-10">
                    <h2 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 mb-5">Folders</h2>
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
                  <h2 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 mb-5">Files</h2>
                  {filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-emerald-300 text-3xl">folder_open</span>
                      </div>
                      <p className="text-on-surface-variant font-medium text-sm">No files here yet</p>
                      <p className="text-on-surface-variant/60 text-xs mt-1">Upload a PDF using the "Add Material" button</p>
                    </div>
                  ) : viewMode === "list" ? (
                    <div className="divide-y divide-emerald-50 stagger-children">
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
      </main>

      {/* ══════════════════ MODAL: New Folder ══════════════════ */}
      {showNewFolderModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-6" onClick={() => setShowNewFolderModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600">create_new_folder</span>
              </div>
              <h3 className="text-lg font-bold text-emerald-900">New Folder</h3>
            </div>
            <input
              id="new-folder-name-input"
              autoFocus
              className="w-full border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-900 placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all mb-6"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowNewFolderModal(false); setNewFolderName(""); }}
                className="px-5 py-2.5 rounded-xl text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors"
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
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
              </div>
              <h3 className="text-lg font-bold text-emerald-900">Upload PDF</h3>
            </div>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors mb-4 ${
                uploadFile ? "border-emerald-400 bg-emerald-50" : "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50"
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
                  <p className="font-semibold text-emerald-900 text-sm">{uploadFile.name}</p>
                  <p className="text-xs text-emerald-600/60">{fmtBytes(uploadFile.size)}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-300 text-4xl">upload_file</span>
                  <p className="font-semibold text-emerald-700 text-sm">Click or drag PDF here</p>
                  <p className="text-xs text-emerald-500/60">Only PDF files supported</p>
                </div>
              )}
            </div>

            {/* Tag selector */}
            <div className="mb-6">
              <label className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 mb-2 block">Tag</label>
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
                <div className="flex justify-between text-xs text-emerald-700 mb-1">
                  <span>Uploading...</span><span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full signature-gradient rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error banner */}
            {uploadError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start animate-fade-in">
                <span className="material-symbols-outlined text-red-400 text-xl flex-shrink-0 mt-0.5">error</span>
                <div>
                  <p className="text-red-700 font-semibold text-sm">Upload Failed</p>
                  <p className="text-red-600/80 text-xs mt-0.5 leading-relaxed">{uploadError}</p>
                  {uploadError.includes("CORS") && (
                    <a
                      href="https://firebase.google.com/docs/storage/web/start#cors"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-red-700 underline mt-1 inline-block"
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
                className="px-5 py-2.5 rounded-xl text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors disabled:opacity-40"
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
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-emerald-900 mb-6">
              Rename {selectedItem?._type === "folder" ? "Folder" : "File"}
            </h3>
            <input
              autoFocus
              className="w-full border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all mb-6"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doRename()}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRenameModal(false)} className="px-5 py-2.5 rounded-xl text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors">
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
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-red-400 text-2xl">delete</span>
            </div>
            <h3 className="text-lg font-bold text-emerald-900 text-center mb-2">
              Delete {selectedItem?._type === "folder" ? "Folder" : "File"}?
            </h3>
            <p className="text-sm text-emerald-600/70 text-center mb-8">
              "<span className="font-semibold">{selectedItem?.name}</span>" will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2.5 rounded-xl border border-emerald-200 text-emerald-800 font-semibold text-sm hover:bg-emerald-50 transition-colors">
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
    </div>
  );
}
