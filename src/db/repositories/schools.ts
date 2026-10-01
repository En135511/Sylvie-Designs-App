import type { SQLiteDatabase } from 'expo-sqlite';
import type { School, SchoolClass } from '../../domain/types';
import { newId, nowISO } from '../../utils/id';

interface SchoolRow {
  id: string;
  name: string;
  notes: string;
  created_at: string;
  class_count?: number;
  student_count?: number;
}

export interface SchoolSummary extends School {
  classCount: number;
  studentCount: number;
}

const toSchool = (r: SchoolRow): School => ({
  id: r.id,
  name: r.name,
  notes: r.notes,
  createdAt: r.created_at,
});

export async function listSchools(db: SQLiteDatabase): Promise<SchoolSummary[]> {
  const rows = await db.getAllAsync<SchoolRow>(
    `SELECT s.*,
       (SELECT COUNT(*) FROM classes c WHERE c.school_id = s.id) AS class_count,
       (SELECT COUNT(*) FROM clients cl JOIN classes c ON c.id = cl.class_id
          WHERE c.school_id = s.id) AS student_count
     FROM schools s ORDER BY s.name COLLATE NOCASE`,
  );
  return rows.map((r) => ({
    ...toSchool(r),
    classCount: r.class_count ?? 0,
    studentCount: r.student_count ?? 0,
  }));
}

export async function getSchool(db: SQLiteDatabase, id: string): Promise<School | null> {
  const row = await db.getFirstAsync<SchoolRow>('SELECT * FROM schools WHERE id = ?', id);
  return row ? toSchool(row) : null;
}

export async function createSchool(
  db: SQLiteDatabase,
  input: { name: string; notes: string },
): Promise<string> {
  const id = newId();
  await db.runAsync(
    'INSERT INTO schools (id, name, notes, created_at) VALUES (?, ?, ?, ?)',
    id,
    input.name.trim(),
    input.notes.trim(),
    nowISO(),
  );
  return id;
}

export async function updateSchool(
  db: SQLiteDatabase,
  id: string,
  input: { name: string; notes: string },
): Promise<void> {
  await db.runAsync(
    'UPDATE schools SET name = ?, notes = ? WHERE id = ?',
    input.name.trim(),
    input.notes.trim(),
    id,
  );
}

/** Deletes the school, its classes, all their students and those students' records. */
export async function deleteSchool(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'DELETE FROM clients WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?)',
      id,
    );
    await db.runAsync('DELETE FROM schools WHERE id = ?', id);
  });
}

export interface ClassSummary extends SchoolClass {
  studentCount: number;
}

export async function listClassesForSchool(
  db: SQLiteDatabase,
  schoolId: string,
): Promise<ClassSummary[]> {
  const rows = await db.getAllAsync<{
    id: string;
    school_id: string;
    name: string;
    created_at: string;
    student_count: number;
  }>(
    `SELECT c.*, (SELECT COUNT(*) FROM clients cl WHERE cl.class_id = c.id) AS student_count
     FROM classes c WHERE c.school_id = ? ORDER BY c.name COLLATE NOCASE`,
    schoolId,
  );
  return rows.map((r) => ({
    id: r.id,
    schoolId: r.school_id,
    name: r.name,
    createdAt: r.created_at,
    studentCount: r.student_count,
  }));
}

export async function createClass(
  db: SQLiteDatabase,
  schoolId: string,
  name: string,
): Promise<string> {
  const id = newId();
  await db.runAsync(
    'INSERT INTO classes (id, school_id, name, created_at) VALUES (?, ?, ?, ?)',
    id,
    schoolId,
    name.trim(),
    nowISO(),
  );
  return id;
}

export async function getClass(
  db: SQLiteDatabase,
  id: string,
): Promise<(SchoolClass & { schoolName: string }) | null> {
  const row = await db.getFirstAsync<{
    id: string;
    school_id: string;
    name: string;
    created_at: string;
    school_name: string;
  }>(
    'SELECT c.*, s.name AS school_name FROM classes c JOIN schools s ON s.id = c.school_id WHERE c.id = ?',
    id,
  );
  return row
    ? {
        id: row.id,
        schoolId: row.school_id,
        name: row.name,
        createdAt: row.created_at,
        schoolName: row.school_name,
      }
    : null;
}

export async function renameClass(db: SQLiteDatabase, id: string, name: string): Promise<void> {
  await db.runAsync('UPDATE classes SET name = ? WHERE id = ?', name.trim(), id);
}

/** Deletes the class, its students and their records. */
export async function deleteClass(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM clients WHERE class_id = ?', id);
    await db.runAsync('DELETE FROM classes WHERE id = ?', id);
  });
}

export interface Student {
  id: string;
  name: string;
  /** Latest measurement of the chosen garment, if the student has been measured. */
  measurementId: string | null;
}

export async function listStudents(
  db: SQLiteDatabase,
  classId: string,
  garment: string,
): Promise<Student[]> {
  const rows = await db.getAllAsync<{ id: string; name: string; measurement_id: string | null }>(
    `SELECT cl.id, cl.name,
       (SELECT m.id FROM measurements m WHERE m.client_id = cl.id AND m.garment = ?
          ORDER BY m.taken_at DESC, m.created_at DESC LIMIT 1) AS measurement_id
     FROM clients cl WHERE cl.class_id = ? ORDER BY cl.name COLLATE NOCASE`,
    garment,
    classId,
  );
  return rows.map((r) => ({ id: r.id, name: r.name, measurementId: r.measurement_id }));
}

/** Adds many students at once (e.g. a pasted class list) in a single transaction. */
export async function addStudents(
  db: SQLiteDatabase,
  classId: string,
  names: string[],
): Promise<number> {
  const now = nowISO();
  await db.withTransactionAsync(async () => {
    for (const name of names) {
      await db.runAsync(
        `INSERT INTO clients (id, name, phone, notes, class_id, created_at, updated_at)
         VALUES (?, ?, '', '', ?, ?, ?)`,
        newId(),
        name,
        classId,
        now,
        now,
      );
    }
  });
  return names.length;
}

/** Next student (alphabetical) after `afterName` who has no measurement of `garment` yet. */
export async function nextUnmeasuredStudent(
  db: SQLiteDatabase,
  classId: string,
  garment: string,
  currentClientId: string,
): Promise<Student | null> {
  const students = await listStudents(db, classId, garment);
  const unmeasured = students.filter((s) => s.measurementId === null && s.id !== currentClientId);
  if (unmeasured.length === 0) return null;
  const currentIndex = students.findIndex((s) => s.id === currentClientId);
  const after = unmeasured.find((s) => students.findIndex((x) => x.id === s.id) > currentIndex);
  return after ?? unmeasured[0] ?? null;
}

export interface SheetSource {
  name: string;
  valuesJson: string | null;
  notes: string;
}

/** Latest measurement of `garment` per student, for exporting a class sheet. */
export async function listClassSheet(
  db: SQLiteDatabase,
  classId: string,
  garment: string,
): Promise<SheetSource[]> {
  const rows = await db.getAllAsync<{
    name: string;
    values_json: string | null;
    notes: string | null;
  }>(
    `SELECT cl.name,
       (SELECT m.values_json FROM measurements m WHERE m.client_id = cl.id AND m.garment = ?1
          ORDER BY m.taken_at DESC, m.created_at DESC LIMIT 1) AS values_json,
       (SELECT m.notes FROM measurements m WHERE m.client_id = cl.id AND m.garment = ?1
          ORDER BY m.taken_at DESC, m.created_at DESC LIMIT 1) AS notes
     FROM clients cl WHERE cl.class_id = ?2 ORDER BY cl.name COLLATE NOCASE`,
    garment,
    classId,
  );
  return rows.map((r) => ({ name: r.name, valuesJson: r.values_json, notes: r.notes ?? '' }));
}
