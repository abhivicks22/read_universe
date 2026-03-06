'use client';

import { useState } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { addNote, updateNote as updateNoteDB, removeNote as removeNoteDB } from '@/lib/storage';

export default function NoteEditor() {
    const {
        activeNotePageEditing,
        setActiveNotePageEditing,
        notes,
        currentPage,
        fileHash,
        addNoteToState,
        updateNoteInState,
        removeNoteFromState,
    } = useReaderStore();

    const [newNoteText, setNewNoteText] = useState('');

    const pageNotes = notes.filter((n) => n.pageNumber === currentPage);

    if (activeNotePageEditing !== currentPage) return null;

    const handleAddNote = async () => {
        if (!newNoteText.trim()) return;
        const now = new Date().toISOString();
        const note = {
            fileHash,
            pageNumber: currentPage,
            content: newNoteText.trim(),
            createdAt: now,
            updatedAt: now,
        };
        const id = await addNote(note);
        addNoteToState({ ...note, id });
        setNewNoteText('');
    };

    const handleUpdateNote = async (id: number, content: string) => {
        await updateNoteDB(id, content);
        updateNoteInState(id, content);
    };

    const handleDeleteNote = async (id: number) => {
        await removeNoteDB(id);
        removeNoteFromState(id);
    };

    return (
        <div
            className="fixed bottom-10 right-4 w-80 max-h-96 z-50 rounded-xl overflow-hidden animate-fade-in flex flex-col"
            style={{
                backgroundColor: 'var(--ag-card)',
                border: '1px solid var(--ag-border)',
                boxShadow: 'var(--ag-shadow-lg)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--ag-text)' }}>
                    Notes — Page {currentPage}
                </h3>
                <button onClick={() => setActiveNotePageEditing(null)} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--ag-text-muted)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Existing notes */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {pageNotes.map((note) => (
                    <NoteItem
                        key={note.id}
                        note={note}
                        onUpdate={handleUpdateNote}
                        onDelete={handleDeleteNote}
                    />
                ))}
                {pageNotes.length === 0 && (
                    <p className="text-xs text-center py-3" style={{ color: 'var(--ag-text-muted)' }}>
                        No notes for this page yet.
                    </p>
                )}
            </div>

            {/* New note input */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--ag-border)' }}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Add a note..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                        className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                        style={{ backgroundColor: 'var(--ag-bg)', color: 'var(--ag-text)', border: '1px solid var(--ag-border)' }}
                    />
                    <button
                        onClick={handleAddNote}
                        disabled={!newNoteText.trim()}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{ backgroundColor: 'var(--ag-accent)', color: 'white', opacity: newNoteText.trim() ? 1 : 0.5 }}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}

function NoteItem({
    note,
    onUpdate,
    onDelete,
}: {
    note: { id?: number; content: string; updatedAt: string };
    onUpdate: (id: number, content: string) => void;
    onDelete: (id: number) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(note.content);

    const handleSave = () => {
        if (note.id && text.trim()) {
            onUpdate(note.id, text.trim());
            setEditing(false);
        }
    };

    return (
        <div className="rounded-lg p-2.5" style={{ backgroundColor: 'var(--ag-bg)' }}>
            {editing ? (
                <div className="flex gap-2">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                        className="flex-1 px-2 py-1 rounded text-xs outline-none"
                        style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)', border: '1px solid var(--ag-border)' }}
                        autoFocus
                    />
                    <button onClick={handleSave} className="text-[10px] font-medium" style={{ color: 'var(--ag-accent)' }}>Save</button>
                </div>
            ) : (
                <div className="flex items-start justify-between gap-2">
                    <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--ag-text)' }}>{note.content}</p>
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditing(true)} className="p-0.5 opacity-50 hover:opacity-100" style={{ color: 'var(--ag-text-muted)' }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </button>
                        <button onClick={() => note.id && onDelete(note.id)} className="p-0.5 opacity-50 hover:opacity-100" style={{ color: 'var(--ag-text-muted)' }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
