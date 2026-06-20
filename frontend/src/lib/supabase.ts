import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

let fs: any;
try {
  if (typeof window === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    fs = require("fs");
  }
} catch {
  // Ignore
}

const DB_FILE = "mock-db.json";

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

export function isSupabaseConfigured() {
  return Boolean(
    getSupabaseUrl() &&
      getSupabaseAnonKey() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

// In-memory mock database for fallback mode
interface MockDB {
  users: any[];
  workspaces: any[];
  agents: any[];
  contributions: any[];
  consensus: any[];
  reports: any[];
  [key: string]: any[];
}

const globalForMock = globalThis as unknown as {
  mockDatabase: MockDB;
};

if (!globalForMock.mockDatabase) {
  globalForMock.mockDatabase = {
    users: [],
    workspaces: [],
    agents: [],
    contributions: [],
    consensus: [],
    reports: [],
  };
}

function getMockDB(): MockDB {
  if (typeof window !== "undefined") {
    return globalForMock.mockDatabase;
  }
  try {
    if (fs && fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      globalForMock.mockDatabase = JSON.parse(data);
    }
  } catch (e) {
    console.error("[Supabase Mock] Failed to load mock db from file:", e);
  }
  return globalForMock.mockDatabase;
}

function saveMockDB(db: MockDB) {
  if (typeof window !== "undefined") {
    return;
  }
  try {
    if (fs) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
    }
  } catch (e) {
    console.error("[Supabase Mock] Failed to save mock db to file:", e);
  }
}

class MockSupabaseQueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderCol: string | null = null;
  private orderAscending = true;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private actionData: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = "*") {
    if (
      this.action !== "insert" &&
      this.action !== "update" &&
      this.action !== "delete"
    ) {
      this.action = "select";
    }
    return this;
  }

  insert(data: any) {
    this.action = "insert";
    this.actionData = data;
    return this;
  }

  update(data: any) {
    this.action = "update";
    this.actionData = data;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => {
      const val = item[column];
      if (typeof val === "string" && typeof value === "string") {
        return val.toLowerCase() === value.toLowerCase();
      }
      return val === value;
    });
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderCol = column;
    this.orderAscending = ascending;
    return this;
  }

  private async execute() {
    const db = getMockDB();
    if (!db[this.table]) {
      db[this.table] = [];
    }
    const list = db[this.table];

    if (this.action === "select") {
      let filtered = [...list];
      for (const filter of this.filters) {
        filtered = filtered.filter(filter);
      }
      if (this.orderCol) {
        filtered.sort((a, b) => {
          const valA = a[this.orderCol!];
          const valB = b[this.orderCol!];
          if (valA < valB) return this.orderAscending ? -1 : 1;
          if (valA > valB) return this.orderAscending ? 1 : -1;
          return 0;
        });
      }
      return { data: filtered, error: null };
    }

    if (this.action === "insert") {
      const dataToInsert = Array.isArray(this.actionData)
        ? this.actionData
        : [this.actionData];
      const inserted: any[] = [];
      for (const rawItem of dataToInsert) {
        const item = {
          id: rawItem.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          ...rawItem,
        };
        list.push(item);
        inserted.push(item);
      }
      db[this.table] = list;
      saveMockDB(db);
      return {
        data: Array.isArray(this.actionData) ? inserted : inserted[0],
        error: null,
      };
    }

    if (this.action === "update") {
      const indices: number[] = [];
      for (let i = 0; i < list.length; i++) {
        let match = true;
        for (const filter of this.filters) {
          if (!filter(list[i])) {
            match = false;
            break;
          }
        }
        if (match) {
          indices.push(i);
        }
      }

      const updated: any[] = [];
      for (const idx of indices) {
        list[idx] = {
          ...list[idx],
          ...this.actionData,
        };
        updated.push(list[idx]);
      }
      db[this.table] = list;
      saveMockDB(db);
      return {
        data: Array.isArray(updated) && updated.length === 1 ? updated[0] : updated,
        error: null,
      };
    }

    if (this.action === "delete") {
      const remaining: any[] = [];
      const deleted: any[] = [];
      for (const item of list) {
        let match = true;
        for (const filter of this.filters) {
          if (!filter(item)) {
            match = false;
            break;
          }
        }
        if (match) {
          deleted.push(item);
        } else {
          remaining.push(item);
        }
      }
      db[this.table] = remaining;
      saveMockDB(db);
      return { data: deleted, error: null };
    }

    return { data: null, error: null };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async single() {
    const res = await this.execute();
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!data) {
      return { data: null, error: { message: "No rows found" } };
    }
    return { data, error: null };
  }

  async maybeSingle() {
    const res = await this.execute();
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    return { data: data || null, error: null };
  }
}

function createMockSupabaseClient() {
  return {
    from: (table: string) => {
      return new MockSupabaseQueryBuilder(table);
    },
  } as any;
}

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) {
    console.log("[Supabase] Returning Mock Client (browser)");
    return createMockSupabaseClient();
  }
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("Missing Supabase public environment variables");
  }
  return createBrowserClient(url, key);
}

export function createServiceRoleClient() {
  if (!isSupabaseConfigured()) {
    console.log("[Supabase] Returning Mock Client (server)");
    return createMockSupabaseClient();
  }
  const url = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
