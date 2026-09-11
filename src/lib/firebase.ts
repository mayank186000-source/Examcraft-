// Firebase removed as requested. Mock/stub objects provided for backward compatibility.

export const app: any = {};
export const db: any = {};
export const auth: any = {
  currentUser: null
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  console.error('Firestore Error:', error);
  throw new Error(error instanceof Error ? error.message : String(error));
}

export async function deleteUser(userIdOrEmail: string): Promise<void> {
  console.log('User deleted locally:', userIdOrEmail);
}
