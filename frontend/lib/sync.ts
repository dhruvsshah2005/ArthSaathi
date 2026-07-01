import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { openDB } from './database';

export const syncOfflineTransactions = async () => {
  try {
    const activeUserId = await SecureStore.getItemAsync('active_user_id');
    if (!activeUserId) return;

    const db = await openDB();
    const unsyncedRows = await db.getAllAsync<{
      transaction_id: string;
      amount: number;
      type: string;
      reason: string;
      created_at: string;
    }>(
      'SELECT transaction_id, amount, type, reason, created_at FROM transactions WHERE user_id = ? AND synced = 0',
      [activeUserId]
    );

    if (!unsyncedRows || unsyncedRows.length === 0) {
      console.log('☁️ Sync: No unsynced transactions found.');
      return;
    }

    console.log(`☁️ Sync: Found ${unsyncedRows.length} unsynced transactions. Syncing...`);

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_URL}/api/transactions/sync`,
      {
        user_id: activeUserId,
        transactions: unsyncedRows.map(row => ({
          transaction_id: row.transaction_id,
          amount: row.amount,
          type: row.type,
          reason: row.reason,
          created_at: row.created_at
        })),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      }
    );

    if (response.status === 200 && response.data.status === 'success') {
      const syncedIds = response.data.synced_ids as string[];
      if (syncedIds && syncedIds.length > 0) {
        await db.withTransactionAsync(async () => {
          for (const id of syncedIds) {
            await db.runAsync('UPDATE transactions SET synced = 1 WHERE transaction_id = ?', [id]);
          }
        });
        console.log(`☁️ Sync: Successfully synced ${syncedIds.length} transactions.`);
      }
    }
  } catch (error: any) {
    console.log('☁️ Sync Error:', error?.message || error);
  }
};
