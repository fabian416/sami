export interface LefterRepository {
  insert(id: string, walletAddress?: string | null, tx?: any): Promise<void>;
}
