import { supabase } from './supabase';
import {
    getAllParsedBooks,
    getAllProgress,
    getVocabWords,
    getBookmarksByBook,
    getHighlightsByBook,
    getNotesByBook,
    saveProgress,
    addBookmark,
    addHighlight,
    addNote,
    addVocabWord,
    type ReadingProgress,
    type Bookmark,
    type Highlight,
    type Note,
    type VocabWord
} from './storage';

/**
 * PUSH: Sync local changes UP to Supabase
 * Called silently in the background when the user is logged in
 */
export async function pushSync() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;

    try {
        // 1. Sync Books metadata (skip raw text)
        const localBooks = await getAllParsedBooks();
        for (const book of localBooks) {
            await supabase.from('books').upsert({
                user_id: userId,
                file_hash: book.fileHash,
                file_name: book.fileName,
                total_pages: book.totalPages,
                word_count: book.wordCount,
                parsed_at: book.parsedAt,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,file_hash' });

            // Sync annotations for this book
            const bookmarks = await getBookmarksByBook(book.fileHash);
            for (const b of bookmarks) {
                await supabase.from('annotations').upsert({
                    id: `bm_${b.id}`,
                    user_id: userId,
                    file_hash: b.fileHash,
                    type: 'bookmark',
                    page_number: b.pageNumber,
                    text_content: b.label,
                    created_at: b.createdAt
                });
            }

            const highlights = await getHighlightsByBook(book.fileHash);
            for (const h of highlights) {
                await supabase.from('annotations').upsert({
                    id: `hl_${h.id}`,
                    user_id: userId,
                    file_hash: h.fileHash,
                    type: 'highlight',
                    page_number: h.pageNumber,
                    text_content: h.text,
                    color: h.color,
                    start_offset: h.startOffset,
                    end_offset: h.endOffset,
                    created_at: h.createdAt
                });
            }

            const notes = await getNotesByBook(book.fileHash);
            for (const n of notes) {
                await supabase.from('annotations').upsert({
                    id: `nt_${n.id}`,
                    user_id: userId,
                    file_hash: n.fileHash,
                    type: 'note',
                    page_number: n.pageNumber,
                    text_content: n.content,
                    created_at: n.createdAt,
                    updated_at: n.updatedAt
                });
            }
        }

        // 2. Sync Progress
        const localProgress = await getAllProgress();
        for (const p of localProgress) {
            await supabase.from('reading_progress').upsert({
                user_id: userId,
                file_hash: p.fileHash,
                file_name: p.fileName,
                current_page: p.currentPage,
                total_pages: p.totalPages,
                percent: p.percent,
                word_count: p.wordCount,
                last_read_at: p.lastReadAt
            }, { onConflict: 'user_id,file_hash' });
        }

        // 3. Sync Vocabulary
        const localVocab = await getVocabWords();
        for (const v of localVocab) {
            await supabase.from('vocabulary').upsert({
                id: `vw_${v.id}`,
                user_id: userId,
                word: v.word,
                definition: v.definition,
                phonetic: v.phonetic,
                part_of_speech: v.partOfSpeech,
                context_sentence: v.contextSentence,
                page_number: v.pageNumber,
                book_name: v.bookName,
                mastered: v.mastered,
                date_added: v.dateAdded
            });
        }

        console.log('✅ Push sync complete');
    } catch (err) {
        console.error('❌ Push sync failed:', err);
    }
}

/**
 * PULL: Sync cloud changes DOWN to local IndexedDB
 * Called on login or initial app load
 */
export async function pullSync() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
        // 1. Pull Progress (Keep latest)
        const { data: cloudProgress } = await supabase.from('reading_progress').select('*');
        if (cloudProgress) {
            // Compare local and cloud, keep the newest 'last_read_at'
            for (const cp of cloudProgress) {
                const local = (await getAllProgress()).find(lp => lp.fileHash === cp.file_hash);
                if (!local || new Date(cp.last_read_at) > new Date(local.lastReadAt)) {
                    await saveProgress({
                        fileHash: cp.file_hash,
                        fileName: cp.file_name,
                        currentPage: cp.current_page,
                        totalPages: cp.total_pages,
                        percent: cp.percent,
                        wordCount: cp.word_count,
                        lastReadAt: cp.last_read_at
                    });
                }
            }
        }

        // 2. Pull Annotations (Bookmarks, Highlights, Notes)
        const { data: cloudAnnotations } = await supabase.from('annotations').select('*');
        if (cloudAnnotations) {
            for (const ca of cloudAnnotations) {
                // Determine type from id prefix (bm_, hl_, nt_)
                if (ca.type === 'bookmark') {
                    // Quick check if exists locally (simplified for this demo by just re-adding since we use autoIncrement locally, 
                    // ideally we'd track cloud IDs locally but for now we'll just push/pull safely)
                    const localBms = await getBookmarksByBook(ca.file_hash);
                    if (!localBms.some(b => b.pageNumber === ca.page_number && b.label === ca.text_content)) {
                        await addBookmark({
                            fileHash: ca.file_hash,
                            pageNumber: ca.page_number,
                            label: ca.text_content,
                            createdAt: ca.created_at
                        });
                    }
                } else if (ca.type === 'highlight') {
                    const localHls = await getHighlightsByBook(ca.file_hash);
                    if (!localHls.some(h => h.pageNumber === ca.page_number && h.text === ca.text_content)) {
                        await addHighlight({
                            fileHash: ca.file_hash,
                            pageNumber: ca.page_number,
                            text: ca.text_content,
                            color: ca.color as Highlight['color'],
                            startOffset: ca.start_offset || 0,
                            endOffset: ca.end_offset || 0,
                            createdAt: ca.created_at
                        });
                    }
                } else if (ca.type === 'note') {
                    const localNotes = await getNotesByBook(ca.file_hash);
                    if (!localNotes.some(n => n.pageNumber === ca.page_number && n.content === ca.text_content)) {
                        await addNote({
                            fileHash: ca.file_hash,
                            pageNumber: ca.page_number,
                            content: ca.text_content,
                            createdAt: ca.created_at,
                            updatedAt: ca.updated_at
                        });
                    }
                }
            }
        }

        console.log('✅ Pull sync complete');
    } catch (err) {
        console.error('❌ Pull sync failed:', err);
    }
}
