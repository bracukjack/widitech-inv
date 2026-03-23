// Migrate existing records that don't have soft delete fields yet
export function migrateSoftDelete<T extends object>(
  records: T[]
): (T & { isDeleted: boolean; deletedAt: string | null })[] {
  return records.map((record) => ({
    isDeleted: false,
    deletedAt: null,
    ...record,
  }));
}

// Migrate nested arrays (e.g. tasks inside projects, notes inside clients)
export function migrateNestedSoftDelete<
  T extends object & { [K in N]: object[] },
  N extends string
>(records: T[], nestedKey: N): T[] {
  return migrateSoftDelete(records).map((record) => ({
    ...record,
    [nestedKey]: migrateSoftDelete(
      (record as unknown as Record<string, object[]>)[nestedKey] || []
    ),
  })) as unknown as T[];
}
